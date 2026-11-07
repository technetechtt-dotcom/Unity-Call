import { useEffect, useRef, useState } from 'react';
import { useParams } from '../lib/router';
import { api } from '../lib/api';

type Signal = { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
type GuestEvent = { type: string; role?: 'host' | 'guest'; error?: string; signal?: Signal; text?: string };

export function GuestJoinPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('Checking invitation…');
  const [valid, setValid] = useState(false);
  const [invitationId, setInvitationId] = useState('');
  const [joined, setJoined] = useState(false);
  const [role, setRole] = useState<'host' | 'guest'>();
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [typed, setTyped] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);
  const roleRef = useRef<'host' | 'guest'>();
  const pending = useRef<RTCIceCandidateInit[]>([]);
  const offerSent = useRef(false);

  useEffect(() => {
    if (!token) { setStatus('Invitation missing.'); return; }
    let mounted = true;
    void api<{ link: { id: string; purpose: string; expiresAt: string } }>(`/api/guest/${encodeURIComponent(token)}`)
      .then(({ link }) => {
        if (!mounted) return;
        if (link.purpose !== 'call') { setStatus('This invitation is not a direct-call room.'); return; }
        setValid(true);
        setInvitationId(link.id);
        setStatus('Valid invitation. Start the room, then share this link with the other participant. The creator must be signed in to host.');
      })
      .catch(error => { if (mounted) setStatus(error instanceof Error ? error.message : 'Invitation unavailable.'); });
    return () => { mounted = false; };
  }, [token]);

  const stop = () => {
    socket.current?.close();
    socket.current = null;
    peer.current?.close();
    peer.current = null;
    localStream.current?.getTracks().forEach(track => track.stop());
    localStream.current = null;
    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    pending.current = [];
    offerSent.current = false;
    roleRef.current = undefined;
    setJoined(false);
    setRole(undefined);
  };

  useEffect(() => () => {
    socket.current?.close();
    peer.current?.close();
    localStream.current?.getTracks().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    if (joined && localVideo.current && localStream.current) localVideo.current.srcObject = localStream.current;
  }, [joined]);

  const send = (data: Record<string, unknown>) => {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(data));
  };

  const start = async () => {
    if (!token || !valid || busy) return;
    setBusy(true);
    setStatus('Requesting microphone and camera…');
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error('This browser does not support real-time calling.');
      const local = await navigator.mediaDevices.getUserMedia({ audio: true, video: videoEnabled });
      localStream.current = local;
      if (localVideo.current) localVideo.current.srcObject = local;
      const config = await api<{ iceServers: RTCIceServer[] }>(`/api/guest/${encodeURIComponent(token)}/ice`);
      const connection = new RTCPeerConnection({ iceServers: config.iceServers });
      peer.current = connection;
      for (const track of local.getTracks()) connection.addTrack(track, local);
      connection.ontrack = event => {
        if (remoteVideo.current && event.streams[0]) remoteVideo.current.srcObject = event.streams[0];
        setStatus('Guest call connected. Live media is not stored by Unity.');
      };
      connection.onicecandidate = event => {
        if (event.candidate) send({ type: 'guest:signal', signal: { candidate: event.candidate.toJSON() } });
      };
      connection.onconnectionstatechange = () => {
        if (connection.connectionState === 'failed') setStatus('Connection failed. Check your network or TURN configuration.');
        if (connection.connectionState === 'disconnected') setStatus('Connection interrupted. Waiting for recovery…');
      };

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
      socket.current = ws;
      ws.onopen = () => send({ type: 'guest:join', token });
      ws.onmessage = event => {
        let payload: GuestEvent;
        try { payload = JSON.parse(String(event.data)) as GuestEvent; } catch { return; }
        if (payload.type === 'guest:error') { setStatus(payload.error || 'Unable to join.'); stop(); return; }
        if (payload.type === 'guest:joined') {
          roleRef.current = payload.role;
          setRole(payload.role);
          setJoined(true);
          setStatus(payload.role === 'host' ? 'Hosting room. Waiting for your guest to open the link…' : 'Joined as guest. Waiting for the host…');
        }
        if (payload.type === 'guest:peer-ready' && roleRef.current === 'host' && !offerSent.current) {
          offerSent.current = true;
          void connection.createOffer().then(async offer => {
            await connection.setLocalDescription(offer);
            send({ type: 'guest:signal', signal: { sdp: offer } });
          }).catch(() => { offerSent.current = false; setStatus('Could not start call negotiation.'); });
        }
        if (payload.type === 'guest:signal' && payload.signal) {
          const signal = payload.signal;
          void (async () => {
            if (signal.sdp) {
              await connection.setRemoteDescription(signal.sdp);
              for (const candidate of pending.current.splice(0)) await connection.addIceCandidate(candidate);
              if (signal.sdp.type === 'offer') {
                const answer = await connection.createAnswer();
                await connection.setLocalDescription(answer);
                send({ type: 'guest:signal', signal: { sdp: answer } });
              }
            }
            if (signal.candidate) {
              if (connection.remoteDescription) await connection.addIceCandidate(signal.candidate);
              else pending.current.push(signal.candidate);
            }
          })().catch(() => setStatus('Call negotiation failed. Try ending the room and joining again.'));
        }
        if (payload.type === 'guest:text' && typeof payload.text === 'string') {
          setMessages(prev => [...prev.slice(-49), `Other participant: ${payload.text}`]);
          if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(payload.text));
        }
        if (payload.type === 'guest:peer-left') setStatus('The other participant left. End the room and join again to restart.');
      };
      ws.onclose = () => setStatus('Room connection closed. Rejoin if needed.');
      ws.onerror = () => setStatus('Unable to connect to the room.');
    } catch (error) {
      stop();
      setStatus(error instanceof Error ? error.message : 'Unable to start guest call.');
    } finally { setBusy(false); }
  };

  const sendTyped = () => {
    if (!typed.trim()) return;
    send({ type: 'guest:text', text: typed.trim().slice(0, 1500) });
    setMessages(prev => [...prev.slice(-49), `You: ${typed.trim()}`]);
    setTyped('');
  };

  return (
    <main className="min-h-dvh p-5 max-w-3xl mx-auto space-y-5">
      <h1 className="text-3xl font-bold">Unity guest call</h1>
      <p role="status" aria-live="polite">{status}</p>
      {valid && <>
        <div className="space-y-2 bg-white rounded-xl p-4">
          <label htmlFor="guest-link" className="block font-medium">Secure invitation link</label>
          <input id="guest-link" className="border rounded-lg p-3 w-full" readOnly value={window.location.href} />
          <button type="button" className="underline min-h-[44px]" onClick={() => void navigator.clipboard.writeText(window.location.href).then(() => setStatus('Invitation link copied.')).catch(() => setStatus('Copy unavailable. Select and copy the link manually.'))}>Copy invitation link</button>
          <p className="text-sm">Anyone with the invitation link can join as the one guest. Do not post it publicly. The creator needs to be signed in to host.</p>
        </div>
        {!joined && <>
          <label className="flex items-center gap-2"><input type="checkbox" checked={videoEnabled} onChange={event => setVideoEnabled(event.target.checked)} /> Enable camera for this call</label>
          <button type="button" disabled={busy} onClick={() => void start()} className="p-3 rounded-lg bg-teal-700 text-white min-h-[48px] disabled:opacity-60">Join call room</button>
        </>}
        {joined && <>
          <p className="font-semibold">Role: {role === 'host' ? 'Host' : 'Guest'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><h2 className="font-medium">Your camera</h2><video ref={localVideo} playsInline muted autoPlay className="w-full rounded-xl bg-black aspect-video object-cover" /></div>
            <div><h2 className="font-medium">Other participant</h2><video ref={remoteVideo} playsInline autoPlay className="w-full rounded-xl bg-black aspect-video object-cover" /></div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="underline min-h-[44px]" onClick={() => { const next = !muted; setMuted(next); localStream.current?.getAudioTracks().forEach(track => { track.enabled = !next; }); }}>{muted ? 'Unmute microphone' : 'Mute microphone'}</button>
            {videoEnabled && <button type="button" className="underline min-h-[44px]" onClick={() => { const next = !cameraOff; setCameraOff(next); localStream.current?.getVideoTracks().forEach(track => { track.enabled = !next; }); }}>{cameraOff ? 'Turn camera on' : 'Turn camera off'}</button>}
            <button type="button" className="p-3 rounded-lg bg-red-700 text-white" onClick={() => { stop(); setStatus('Call ended.'); }}>End guest call</button>
            {role === 'host' && invitationId && <button type="button" className="underline min-h-[44px]" onClick={() => {
              void api(`/api/guest-links/${invitationId}`, { method: 'DELETE' }).then(() => {
                stop(); setValid(false); setStatus('Invitation revoked. This link can no longer be used.');
              }).catch(error => setStatus(error instanceof Error ? error.message : 'Could not revoke invitation.'));
            }}>Revoke invitation link</button>}
          </div>
          <section className="space-y-3" aria-label="Typed conversation">
            <h2 className="text-xl font-semibold">Typed replies</h2>
            <div role="log" aria-live="polite" className="bg-gray-100 text-black rounded-lg p-3 max-h-40 overflow-y-auto">
              {messages.length ? messages.map((text, index) => <p key={index}>{text}</p>) : <p>No typed replies yet.</p>}
            </div>
            <form className="flex gap-2" onSubmit={event => { event.preventDefault(); sendTyped(); }}>
              <input value={typed} onChange={event => setTyped(event.target.value)} maxLength={1500} aria-label="Type a reply to the other participant" className="border rounded-lg p-3 flex-1 min-w-0" />
              <button type="submit" className="px-4 rounded-lg bg-teal-700 text-white">Send</button>
            </form>
          </section>
        </>}
      </>}
    </main>
  );
}
