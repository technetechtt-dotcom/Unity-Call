import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from '../lib/router';
import { Phone, PhoneOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { announce, vibrate } from '../lib/haptics';
import type { CallRecord } from '../lib/types';

export function IncomingCallPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { highContrast, vibrationEnabled, ttsEnabled } = useAccessibility();
  const { user } = useAuth();
  const state = location.state as { call?: CallRecord; caller?: { name: string } } | null;
  const [current, setCurrent] = useState<{ call: CallRecord; caller: { name: string } } | null>(
    state?.call ? { call: state.call, caller: state.caller || { name: 'Incoming caller' } } : null
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!state?.call);
  const [busy, setBusy] = useState(false);
  const callerName = current?.caller.name || 'Incoming caller';

  useEffect(() => {
    if (!id || current) return;
    let active = true;
    void api<{ call: CallRecord & { peer: { name: string } } }>(`/api/calls/${id}`)
      .then(({ call }) => {
        if (!active) return;
        if (call.status !== 'ringing') { navigate('/calls'); return; }
        setCurrent({ call, caller: { name: call.peer.name } });
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Unable to load incoming call.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, current, navigate]);

  useEffect(() => {
    announce(`Incoming call from ${callerName}`);
    if (vibrationEnabled) vibrate([250, 100, 250, 100, 400]);
    if (ttsEnabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Incoming call from ${callerName}. Accept or reject.`);
      window.speechSynthesis.speak(utterance);
    }
    if ('Notification' in window && Notification.permission !== 'denied') {
      void Notification.requestPermission();
    }
  }, [callerName, ttsEnabled, vibrationEnabled]);

  const act = async (action: 'accept' | 'reject') => {
    if (!id || !current || busy) return;
    setError(''); setBusy(true);
    window.speechSynthesis.cancel();
    const saveTranscript = action === 'accept' && !!current.call.transcriptRequested
      ? window.confirm('The caller requested to save a transcript. Allow Unity to save this call transcript? Live captions work even if you decline.')
      : false;
    try {
      await api(`/api/calls/${id}/${action}`, { method: 'POST', body: JSON.stringify({ saveTranscript }) });
      if (action === 'accept') navigate(`/calls/active/${id}`, { state: { incoming: true, peerName: callerName, callType: current.call.type } });
      else navigate('/chats');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to respond to call.'); }
    finally { setBusy(false); }
  };

  return (
    <div className={`flex flex-col min-h-dvh ${highContrast ? 'bg-black' : 'bg-gradient-to-b from-teal-900 to-gray-900'} text-white`}>
      <motion.div
        className="absolute inset-0 bg-white/10 pointer-events-none"
        animate={user ? { opacity: [0, 0.25, 0] } : undefined}
        transition={{ repeat: Infinity, duration: 1.4 }}
      />
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-32 h-32 rounded-full bg-white text-primary flex items-center justify-center text-4xl font-bold mb-6">
          {callerName.slice(0, 1)}
        </div>
        <h1 className="text-4xl font-bold mb-2">{callerName}</h1>
        <p className="text-xl mb-6">Incoming call</p>
        {loading && <p role="status">Loading call details…</p>}
        {error && <p role="alert" className="text-yellow-300">{error}</p>}
        <p className="text-sm opacity-80">Visual flash, spoken name, and vibration are on if you enabled them. Call audio starts only after you accept.</p>
      </main>
      <footer className="p-8 grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={busy || !current}
          onClick={() => void act('reject')}
          className="min-h-[72px] rounded-2xl bg-danger text-white"
          aria-label="Reject call"
        >
          <PhoneOff className="mx-auto mb-1" />
          Reject
        </button>
        <button
          type="button"
          disabled={busy || !current}
          onClick={() => void act('accept')}
          className="min-h-[72px] rounded-2xl bg-success text-white"
          aria-label="Accept call"
        >
          <Phone className="mx-auto mb-1" />
          Accept
        </button>
      </footer>
    </div>
  );
}
