import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../context/AccessibilityContext';
import { BottomNav } from '../components/BottomNav';
import { api } from '../lib/api';
import type { CallRecord } from '../lib/types';

export function CallHistoryPage() {
  const { highContrast } = useAccessibility();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<{ calls: CallRecord[] }>('/api/calls').then((data) => setCalls(data.calls)).catch(err => setError(err instanceof Error ? err.message : 'Could not load calls.')).finally(() => setLoading(false));
  }, []);

  const callback = async (call: CallRecord) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
    const saveTranscript = window.confirm(
      'Save a transcript of this callback? Live captions still work if you choose no.'
    );
    const data = await api<{ call: { id: string } }>('/api/calls', {
      method: 'POST',
      body: JSON.stringify({ userId: call.peer.id, type: call.type, saveTranscript })
    });
    navigate(`/calls/active/${data.call.id}`, { state: { outgoing: true, peerName: call.peer.name, callType: call.type } });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to call this person.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col min-h-dvh pb-16">
      <header className={`px-6 py-4 ${highContrast ? 'bg-gray-900 border-b-2 border-white' : 'bg-white shadow-sm'}`}>
        <h1 className="text-2xl font-bold">{t('call.history')}</h1>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading && <p role="status">Loading call history…</p>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {!loading && calls.length === 0 && <p>{t('call.noCalls')}</p>}
        {calls.map((call) => (
          <div key={call.id} className={`flex items-center p-4 rounded-2xl ${highContrast ? 'border-2 border-white' : 'bg-white shadow-sm'}`}>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{call.peer.name}</p>
              <p className="text-sm opacity-70 flex items-center gap-2">
                {call.status === 'missed' ? <PhoneMissed size={16} /> : call.direction === 'incoming' ? <PhoneIncoming size={16} /> : <PhoneOutgoing size={16} />}
                {call.status} {call.durationSeconds ? `· ${Math.round(call.durationSeconds / 60)} min` : ''}
              </p>
              <p className="text-xs opacity-60">{new Date(call.createdAt).toLocaleString()}</p>
            </div>
            <button
              type="button"
              className="p-3 rounded-full min-h-[48px]"
              aria-label={`${t('call.callback')} ${call.peer.name}`}
              disabled={busy}
              onClick={() => void callback(call)}
            >
              <Phone />
            </button>
          </div>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
