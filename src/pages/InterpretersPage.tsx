import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface Interpreter { id: string; userId: string; name: string; bio?: string; languages: string[]; qualified: boolean; available: boolean; reviewStatus?: string }
interface Booking { id: string; interpreterId: string; startsAt: string; status: string; requesterId: string }

export function InterpretersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interpreters, setInterpreters] = useState<Interpreter[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notice, setNotice] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    const [directory, mine] = await Promise.all([
      api<{ interpreters: Interpreter[]; notice: string }>('/api/interpreters'),
      api<{ bookings: Booking[] }>('/api/bookings')
    ]);
    setInterpreters(directory.interpreters);
    setNotice(directory.notice);
    setBookings(mine.bookings);
  };
  useEffect(() => { void refresh().catch((e: Error) => setError(e.message)); }, []);
  const act = async (action: () => Promise<void>) => {
    setError(''); setSuccess(''); setBusy(true);
    try { await action(); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Request failed.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="min-h-dvh">
      <header className="px-4 py-3 flex gap-3 items-center bg-white shadow-sm">
        <button type="button" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft /></button>
        <h1 className="font-bold">SASL interpreters</h1>
      </header>
      <main className="p-5 space-y-5 max-w-xl mx-auto">
        <p>{notice}</p>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {success && <p role="status" className="text-green-800">{success}</p>}
        <form className="space-y-3 rounded-xl bg-white p-4" onSubmit={event => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void act(async () => {
            await api('/api/interpreters', { method: 'POST', body: JSON.stringify({ bio: data.get('bio'), languages: ['SASL', 'English'], available: true }) });
            setSuccess('Profile submitted. Independent qualification verification is required before bookings can be accepted.');
          });
        }}>
          <h2 className="font-semibold">Apply as an interpreter</h2>
          <Input name="bio" label="Experience and qualifications" placeholder="Describe your relevant experience"/>
          <Button type="submit" disabled={busy}>Submit profile</Button>
        </form>
        {interpreters.some(item => item.userId === user?.id) && <section className="space-y-3 bg-white rounded-xl p-4">
          <h2 className="font-bold">My interpreter availability</h2>
          {interpreters.filter(item => item.userId === user?.id).map(item => <div key={item.id} className="space-y-2">
            <p>Status: {item.reviewStatus || 'pending'} · {item.qualified ? 'Verified' : 'Not verified'}</p>
            <label className="flex items-center gap-3"><input type="checkbox" checked={item.available} onChange={event => void act(async () => {
              await api('/api/interpreters', { method: 'POST', body: JSON.stringify({ available: event.target.checked }) });
              setSuccess('Availability updated.');
            })} /> Available for new requests</label>
          </div>)}
        </section>}
        <section className="space-y-3">
          <h2 className="font-bold">Request a session</h2>
          <label htmlFor="interpreter-time" className="block">Preferred session time</label>
          <input id="interpreter-time" type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="w-full p-3 border rounded-lg"/>
          {interpreters.length === 0 && <p>No interpreters registered yet.</p>}
          {interpreters.map(item => <article key={item.id} className="p-4 rounded-xl bg-white shadow-sm space-y-2">
            <h3 className="font-semibold">{item.name}</h3><p>{item.bio || 'Profile pending review.'}</p>
            <p className="text-sm">{item.languages.join(', ')} · {item.qualified ? 'Verified' : 'Unverified'} · {item.available ? 'Available' : 'Unavailable'}</p>
            <Button disabled={busy || !item.qualified || !item.available} onClick={() => void act(async () => {
              if (!startsAt || Date.parse(startsAt) <= Date.now()) throw Error('Choose a future session time.');
              await api(`/api/interpreters/${item.id}/book`, { method: 'POST', body: JSON.stringify({ startsAt: new Date(startsAt).toISOString() }) });
              setSuccess('Session requested. The interpreter must accept your booking.');
            })}>Request session</Button>
          </article>)}
        </section>
        <section className="space-y-3">
          <h2 className="font-bold">Your booking requests</h2>
          {bookings.length === 0 && <p>No bookings yet.</p>}
          {bookings.map(b => <article key={b.id} className="bg-white p-4 rounded-xl space-y-2">
            <p>{interpreters.find(i => i.id === b.interpreterId)?.name || 'Interpreter'}</p>
            <p className="text-sm">{new Date(b.startsAt).toLocaleString()} · {b.status}</p>
            {user?.id === b.requesterId && (b.status === 'requested' || b.status === 'accepted') && <Button variant="outline" disabled={busy} onClick={() => void act(async () => {
              await api(`/api/bookings/${b.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) });
              setSuccess('Booking cancelled.');
            })}>Cancel booking</Button>}
            {interpreters.some(item => item.id === b.interpreterId && item.userId === user?.id) && b.status === 'requested' && <div className="flex flex-wrap gap-2">
              {(['accepted','declined'] as const).map(status => <Button key={status} variant="outline" disabled={busy} onClick={() => void act(async () => {
                await api(`/api/bookings/${b.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
                setSuccess(`Booking ${status}.`);
              })}>{status === 'accepted' ? 'Accept session' : 'Decline session'}</Button>)}
            </div>}
            {interpreters.some(item => item.id === b.interpreterId && item.userId === user?.id) && b.status === 'accepted' && <Button variant="outline" disabled={busy} onClick={() => void act(async () => {
              await api(`/api/bookings/${b.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) });
              setSuccess('Session marked completed.');
            })}>Complete session</Button>}
          </article>)}
        </section>
      </main>
    </div>
  );
}
