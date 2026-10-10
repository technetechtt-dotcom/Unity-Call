import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from '../lib/router';
import { Hand, History, Mic, MicOff, PhoneOff, Subtitles, Type } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTTS } from '../hooks/useTTS';
import { SignLanguagePanel } from '../components/SignLanguagePanel';
import { SignAvatarPlayer } from '../components/SignAvatarPlayer';
import { api } from '../lib/api';
import { realtime } from '../lib/socket';
import { createPeerConnection, getConnectionStats, setTrackEnabled } from '../lib/webrtc';
import { detectConfirmations, sourceLabel } from '../lib/confirmations';
import type { TranscriptSegment } from '../lib/types';

export function ActiveCallPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { highContrast, fontSize, setFontSize, language, captionOverlayOpacity, signLanguageEnabled, signAvatarEnabled, ttsEnabled } = useAccessibility();
  const { speak, cancel, isSpeaking } = useTTS();
  const state = location.state as { outgoing?: boolean; incoming?: boolean; peerName?: string } | null;
  const peerName = state?.peerName || 'Participant';
  const [muted, setMuted] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showSign, setShowSign] = useState(signLanguageEnabled);
  const [typed, setTyped] = useState('');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [cards, setCards] = useState(detectConfirmations(''));
  const [quality, setQuality] = useState('good');
  const [bytes, setBytes] = useState(0);
  const [duration, setDuration] = useState(0);
  const [saveNotice] = useState('Transcripts are saved only if you chose that before this call.');
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const {
    interimTranscript,
    segments: spoken,
    startListening,
    stopListening,
    supported
  } = useSpeechRecognition(language);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      localStream.current = stream;
      if (localVideo.current) localVideo.current.srcObject = stream;
      const pc = await createPeerConnection((remote) => {
        if (remoteVideo.current) remoteVideo.current.srcObject = remote;
      });
      peer.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          realtime.send({ type: 'call:signal', callId: id, signal: { candidate: event.candidate } });
        }
      };
      if (state?.outgoing) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        realtime.send({ type: 'call:signal', callId: id, signal: { sdp: offer } });
      }
    };
    void start().catch(() => {
      setQuality('media-blocked');
    });
    const timer = window.setInterval(() => setDuration((value) => value + 1), 1000);
    const statsTimer = window.setInterval(() => {
      void getConnectionStats(peer.current).then((stats) => {
        setQuality(stats.quality);
        setBytes(stats.bytes);
      });
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearInterval(statsTimer);
      localStream.current?.getTracks().forEach((track) => track.stop());
      peer.current?.close();
    };
  }, [id, state?.outgoing]);

  useEffect(() => {
    const unsubscribe = realtime.subscribe((payload) => {
      if (payload.type === 'call:signal' && payload.callId === id) {
        const signal = payload.signal as { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
        void (async () => {
          if (!peer.current) return;
          if (signal.sdp) {
            await peer.current.setRemoteDescription(signal.sdp);
            if (signal.sdp.type === 'offer') {
              const answer = await peer.current.createAnswer();
              await peer.current.setLocalDescription(answer);
              realtime.send({ type: 'call:signal', callId: id, signal: { sdp: answer } });
            }
          }
          if (signal.candidate) await peer.current.addIceCandidate(signal.candidate);
        })();
      }
      if (payload.type === 'call:caption' && payload.callId === id) {
        const segment = payload.segment as TranscriptSegment;
        setSegments((prev) => [...prev, segment]);
        setCards(detectConfirmations(segment.text));
      }
      if (payload.type === 'call:tts' && payload.callId === id) {
        cancel();
        speak(String(payload.text || ''));
      }
      if (payload.type === 'call:action' && payload.callId === id) {
        const action = String(payload.action);
        if (action === 'repeat') speak(segments[segments.length - 1]?.text || 'Nothing to repeat yet');
        if (action === 'slow') speak('Please speak more slowly.');
        if (action === 'spell') speak(String(payload.value || user?.name || '').split('').join(' '));
      }
      if (payload.type === 'call:state') {
        const call = payload.call as { status: string };
        if (['ended', 'rejected', 'missed', 'busy'].includes(call.status)) navigate('/calls');
      }
    });
    return () => {
      unsubscribe();
    };
  }, [cancel, id, navigate, segments, speak, user?.name]);

  useEffect(() => {
    if (captionsOn && supported) startListening();
    else stopListening();
    return () => stopListening();
  }, [captionsOn, startListening, stopListening, supported]);

  useEffect(() => {
    const last = spoken[spoken.length - 1];
    if (!last || !id || !user) return;
    const segment = {
      id: last.id,
      callId: id,
      speakerId: user.id,
      speakerName: user.name,
      text: last.text,
      source: 'speech' as const,
      createdAt: new Date().toISOString()
    };
    setSegments((prev) => (prev.some((item) => item.id === segment.id) ? prev : [...prev, segment]));
    void api(`/api/calls/${id}/transcript`, {
      method: 'POST',
      body: JSON.stringify({ text: last.text, source: 'speech', speakerName: user.name })
    });
  }, [id, spoken, user]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setTrackEnabled(localStream.current, 'audio', !next);
  };

  const sendTyped = async () => {
    if (!typed.trim() || !id || !user) return;
    realtime.send({ type: 'call:tts', callId: id, text: typed });
    await api(`/api/calls/${id}/transcript`, {
      method: 'POST',
      body: JSON.stringify({ text: typed, source: 'typed', speakerName: user.name })
    });
    setSegments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        callId: id,
        speakerId: user.id,
        speakerName: user.name,
        text: typed,
        source: 'typed',
        createdAt: new Date().toISOString()
      }
    ]);
    setTyped('');
  };

  const endCall = async () => {
    if (id) await api(`/api/calls/${id}/end`, { method: 'POST' });
    localStream.current?.getTracks().forEach((track) => track.stop());
    navigate('/calls');
  };

  const action = (name: 'repeat' | 'slow' | 'spell', value?: string) => {
    realtime.send({ type: 'call:action', callId: id, action: name, value });
  };

  return (
    <div className={`flex flex-col min-h-dvh ${highContrast ? 'bg-black text-white' : 'bg-gray-900 text-white'}`}>
      {showSign && (
        <SignLanguagePanel
          onClose={() => setShowSign(false)}
          onSignDetected={(text) => {
            if (!id || !user) return;
            void api(`/api/calls/${id}/transcript`, {
              method: 'POST',
              body: JSON.stringify({ text, source: 'sign', speakerName: user.name })
            });
          }}
        />
      )}
      <header className="p-4 text-center">
        <h1 className="text-2xl font-bold">{peerName}</h1>
        <p aria-live="polite">{Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')} · Connection {quality} · Data {Math.round(bytes / 1024)} KB</p>
        <p className="text-xs opacity-70 mt-1">{saveNotice}</p>
      </header>

      <div className="grid grid-cols-2 gap-2 px-4">
        <video ref={localVideo} autoPlay muted playsInline className="rounded-xl bg-black h-32 object-cover" aria-label="Your camera" />
        <video ref={remoteVideo} autoPlay playsInline className="rounded-xl bg-black h-32 object-cover" aria-label="Other participant" />
      </div>
      {signAvatarEnabled && (
        <div className="px-4 mt-2">
          <SignAvatarPlayer text={segments[segments.length - 1]?.text || ''} isActive={!!segments[segments.length - 1]} />
        </div>
      )}

      <main className="flex-1 px-4 py-3 min-h-0">
        <div
          className="h-full rounded-2xl p-4 overflow-y-auto"
          style={{ backgroundColor: `rgba(0,0,0,${captionOverlayOpacity})` }}
          role="log"
          aria-live="polite"
        >
          <div className="flex justify-between mb-3">
            <span>{supported ? 'Live captions from each speaker' : 'Captions unavailable in this browser'}</span>
            <button type="button" onClick={() => setShowHistory((value) => !value)} aria-pressed={showHistory} aria-label="Show caption history">
              <History size={18} />
            </button>
          </div>
          {(showHistory ? segments : segments.slice(-4)).map((segment) => (
            <p key={segment.id} className="mb-2">
              <span className="text-xs opacity-70">{segment.speakerName} · {sourceLabel(segment.source)}</span>
              <span className="block">{segment.text}</span>
            </p>
          ))}
          {captionsOn && <p className="opacity-80">{interimTranscript}</p>}
          {cards.map((card) => (
            <div key={card.id} className="mt-3 p-3 rounded-xl bg-white/10">
              <p className="text-sm font-semibold">Confirm {card.kind}</p>
              <p>{card.value}</p>
              <button
                type="button"
                className="underline text-sm"
                onClick={() => {
                  if (!id || !user) return;
                  void api(`/api/calls/${id}/transcript`, {
                    method: 'POST',
                    body: JSON.stringify({ text: `Confirmed ${card.kind}: ${card.value}`, source: 'correction', speakerName: user.name })
                  });
                }}
              >
                Confirm for both of us
              </button>
            </div>
          ))}
        </div>
      </main>

      <form
        className="px-4 pb-2 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void sendTyped();
        }}
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="flex-1 min-h-[48px] rounded-xl px-3 text-black"
          placeholder="Type a reply. The other person will hear it spoken."
          aria-label="Type a reply to speak to the other person"
        />
        <button type="submit" className="px-3 rounded-xl bg-teal-600 min-h-[48px]">Speak</button>
      </form>

      <div className="px-4 pb-2 flex flex-wrap gap-2">
        <button type="button" className="px-3 py-2 rounded-full bg-white/10" onClick={() => action('repeat')}>Repeat</button>
        <button type="button" className="px-3 py-2 rounded-full bg-white/10" onClick={() => action('slow')}>Speak more slowly</button>
        <button type="button" className="px-3 py-2 rounded-full bg-white/10" onClick={() => action('spell', user?.name)}>Spell the name</button>
      </div>

      <footer className="p-4 grid grid-cols-5 gap-2">
        <button type="button" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Unmute microphone' : 'Mute microphone'} className="text-center">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${muted ? 'bg-white text-black' : 'bg-white/10'}`}>
            {muted ? <MicOff /> : <Mic />}
          </div>
          <span className="text-[10px]">{muted ? 'Muted' : 'Mute'}</span>
        </button>
        <button type="button" onClick={() => setShowSign((value) => !value)} aria-pressed={showSign} aria-label="Sign language panel" className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><Hand /></div>
          <span className="text-[10px]">Sign</span>
        </button>
        <button type="button" onClick={() => setCaptionsOn((value) => !value)} aria-pressed={captionsOn} aria-label="Captions" className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><Subtitles /></div>
          <span className="text-[10px]">Captions</span>
        </button>
        <button
          type="button"
          onClick={() => setFontSize(fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'xlarge' : 'normal')}
          aria-label={`Caption size ${fontSize}`}
          className="text-center"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><Type /></div>
          <span className="text-[10px]">Size</span>
        </button>
        <button type="button" onClick={() => void endCall()} aria-label="End call" className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-600 flex items-center justify-center"><PhoneOff /></div>
          <span className="text-[10px]">End</span>
        </button>
      </footer>
      {ttsEnabled && isSpeaking && (
        <p className="sr-only" aria-live="polite">Spoken reply is playing. Screen reader speech is paused.</p>
      )}
    </div>
  );
}
