import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';

interface Org { id: string; name: string; kind: string; description?: string; desks: { id: string; name: string }[] }
interface Appointment { id: string; orgId: string; startsAt: string; status: string }

export function OrganizationsPage() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [guestUrl, setGuestUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    const [directory, mine] = await Promise.all([
      api<{ organizations: Org[] }>('/api/orgs'),
      api<{ appointments: Appointment[] }>('/api/appointments')
    ]);
    setOrgs(directory.organizations);
    setAppointments(mine.appointments);
  };
  useEffect(() => {
    void refresh().catch((err: Error) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const run = async (work: () => Promise<void>) => {
    setError(''); setMessage('');
    try { await work(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to complete request.'); }
  };
  const makeLink = async (orgId: string) => run(async () => {
    const data = await api<{ url: string }>('/api/guest-links', {
      method: 'POST', body: JSON.stringify({ purpose: 'org', targetId: orgId })
    });
    setGuestUrl(`${window.location.origin}${data.url}`);
    setMessage('Invitation created. Visitors can open the link and sign in to check in at a service desk.');
  });
  const book = async () => run(async () => {
    if (!selected || !startsAt || Date.parse(startsAt) <= Date.now()) throw Error('Choose an organisation and a future date and time.');
    await api(`/api/orgs/${selected}/appointments`, {
      method: 'POST', body: JSON.stringify({ startsAt: new Date(startsAt).toISOString() })
    });
    await refresh();
    setMessage('Appointment requested successfully. This is not yet a staff-confirmed time slot.');
  });
  const cancel = async (id: string) => run(async () => {
    await api(`/api/appointments/${id}/cancel`, { method: 'POST' });
    await refresh(); setMessage('Appointment cancelled.');
  });
  return (
    <div className="min-h-dvh">
      <header className="px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
        <button type="button" className="p-2" aria-label="Back" onClick={() => navigate(-1)}><ArrowLeft /></button>
        <h1 className="font-bold">Organisation directory</h1>
      </header>
      <main className="p-5 space-y-5 max-w-2xl mx-auto">
        <p>Discover service desks and request appointments. Staff-confirmed availability and browser guest calling are not yet enabled.</p>
        {loading && <p role="status">Loading organisations…</p>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {message && <p role="status" className="text-green-800">{message}</p>}
        <section className="rounded-xl bg-white p-4 space-y-3">
          <h2 className="font-bold">Request an appointment</h2>
          <label htmlFor="organisation">Organisation</label>
          <select id="organisation" className="block w-full p-3 border rounded-lg" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">Select an organisation</option>
            {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
          <label htmlFor="appointment-time" className="block">Preferred date and time</label>
          <input id="appointment-time" type="datetime-local" className="block w-full p-3 border rounded-lg" value={startsAt} onChange={e => setStartsAt(e.target.value)}/>
          <Button onClick={() => void book()}>Request appointment</Button>
        </section>
        <section className="space-y-3">
          <h2 className="font-bold">Your appointments</h2>
          {appointments.length === 0 && <p>No appointments yet.</p>}
          {appointments.map(a => <div key={a.id} className="bg-white rounded-xl p-4 flex justify-between gap-3 items-center">
            <div><p>{orgs.find(o => o.id === a.orgId)?.name || 'Organisation'}</p><p className="text-sm">{new Date(a.startsAt).toLocaleString()} · {a.status}</p></div>
            {a.status === 'booked' && <Button variant="outline" onClick={() => void cancel(a.id)}>Cancel</Button>}
          </div>)}
        </section>
        <section className="space-y-3">
          <h2 className="font-bold">Service desks</h2>
          {orgs.map(org => <article key={org.id} className="p-4 rounded-xl bg-white shadow-sm space-y-2">
            <h3 className="font-semibold">{org.name}</h3><p className="text-sm">{org.kind}</p><p>{org.description}</p>
            {org.desks.map(d => <Button key={d.id} variant="secondary" onClick={() => void run(async () => {
              const result = await api<{ item: { position: number } }>(`/api/desks/${d.id}/queue`, { method: 'POST' });
              setMessage(`Joined ${d.name} queue. Position: ${result.item.position}.`);
            })}>Join {d.name} queue</Button>)}
            <Button variant="outline" onClick={() => void makeLink(org.id)}>Create invitation link</Button>
          </article>)}
        </section>
        {guestUrl && <div className="rounded-xl bg-white p-4 space-y-2">
          <p className="font-semibold">Invitation link</p>
          <input readOnly value={guestUrl} aria-label="Guest invitation link" className="w-full p-2 border rounded"/>
          <Button variant="outline" onClick={() => void navigator.clipboard.writeText(guestUrl).then(() => setMessage('Link copied.')).catch(() => setError('Copy failed. Select and copy the link manually.'))}>Copy link</Button>
        </div>}
      </main>
    </div>
  );
}
