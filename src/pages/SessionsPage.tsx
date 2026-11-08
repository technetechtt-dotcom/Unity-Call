import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { api, clearLegacyToken } from '../lib/api';
import { Button } from '../components/ui/Button';

type Session = { id: string; userAgent?: string; createdAt: string; expiresAt: string; current: boolean };
export function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = async () => {
    const data = await api<{ sessions: Session[] }>('/api/auth/sessions');
    setSessions(data.sessions);
  };
  useEffect(() => { void load().catch((e: Error) => setError(e.message)); }, []);
  const revoke = async (id: string, current: boolean) => {
    setError(''); setMessage('');
    try {
      await api(`/api/auth/sessions/${id}`, { method: 'DELETE' });
      if (current) { clearLegacyToken(); window.location.assign('/login'); return; }
      await load();
      setMessage('Session signed out.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not end session.'); }
  };
  const renewSession = async () => {
    setError(''); setMessage('');
    try {
      await api('/api/auth/rotate', { method: 'POST' });
      // Old WebSocket authentications contain the previous token and must reconnect.
      window.location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to renew session.'); }
  };
  const signOutAll = async () => {
    if (!window.confirm('Sign out on all devices, including this one?')) return;
    try {
      await api('/api/auth/logout-all', { method: 'POST' });
      clearLegacyToken();
      window.location.assign('/login');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not sign out devices.'); }
  };
  const exportData = async () => {
    setError('');
    try {
      const data = await api<{ export: unknown }>('/api/auth/export');
      const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'unity-call-my-data.json'; link.click();
      URL.revokeObjectURL(url);
      setMessage('Your data export was downloaded.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not export your data.'); }
  };
  return (
    <main className="min-h-dvh max-w-xl mx-auto p-5 space-y-4">
      <button type="button" onClick={() => navigate('/settings')} className="underline min-h-[44px]">Back to settings</button>
      <h1 className="text-2xl font-bold">Devices and your data</h1>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {message && <p role="status" className="text-green-800">{message}</p>}
      <section className="space-y-3">
        <h2 className="font-semibold">Active sessions</h2>
        <Button variant="outline" onClick={() => void renewSession()}>Renew and rotate this session securely</Button>
        {sessions.length === 0 && <p>No active sessions found.</p>}
        {sessions.map(s => <article key={s.id} className="bg-white rounded-xl p-4 space-y-2">
          <p className="font-semibold">{s.current ? 'This device' : 'Other device'}</p>
          <p className="text-sm break-words">{s.userAgent || 'Unknown browser'}</p>
          <p className="text-sm">Signed in: {new Date(s.createdAt).toLocaleString()}</p>
          <p className="text-sm">Expires: {new Date(s.expiresAt).toLocaleString()}</p>
          <Button variant="outline" onClick={() => void revoke(s.id, s.current)}>Sign out device</Button>
        </article>)}
        <Button onClick={() => void signOutAll()}>Sign out on all devices</Button>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Your personal information</h2>
        <p>Download the account, messages and records available to your signed-in account. Keep this file secure.</p>
        <Button variant="outline" onClick={() => void exportData()}>Download my data</Button>
      </section>
    </main>
  );
}
