import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';

type Desk = { id: string; name: string };
type Org = { id: string; name: string; kind: string; role: string; desks: Desk[] };
type Appointment = { id: string; userId: string; startsAt: string; status: string };
type QueueItem = { id: string; visitorId: string; position: number; status: string };

export function OrganisationAdminPage() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('business');
  const [selected, setSelected] = useState('');
  const [deskName, setDeskName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [staffRole, setStaffRole] = useState<'staff' | 'viewer'>('staff');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueDesk, setQueueDesk] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const current = orgs.find(o => o.id === selected);
  const refresh = async () => {
    const data = await api<{ organizations: Org[] }>('/api/orgs/mine');
    setOrgs(data.organizations);
  };
  useEffect(() => { void refresh().catch((e: Error) => setError(e.message)); }, []);
  useEffect(() => {
    if (!selected) { setAppointments([]); return; }
    void api<{ appointments: Appointment[] }>(`/api/orgs/${selected}/appointments`)
      .then(data => setAppointments(data.appointments))
      .catch((e: Error) => setError(e.message));
  }, [selected]);
  useEffect(() => {
    if (!queueDesk) { setQueue([]); return; }
    void api<{ queue: QueueItem[] }>(`/api/desks/${queueDesk}/queue`)
      .then(data => setQueue(data.queue))
      .catch((e: Error) => setError(e.message));
  }, [queueDesk]);
  const run = async (action: () => Promise<void>) => {
    setError(''); setMessage(''); setBusy(true);
    try { await action(); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Request failed.'); }
    finally { setBusy(false); }
  };
  const refreshSelected = async () => {
    if (selected) {
      const data = await api<{ appointments: Appointment[] }>(`/api/orgs/${selected}/appointments`);
      setAppointments(data.appointments);
    }
    if (queueDesk) {
      const data = await api<{ queue: QueueItem[] }>(`/api/desks/${queueDesk}/queue`);
      setQueue(data.queue);
    }
  };
  return (
    <main className="min-h-dvh max-w-2xl mx-auto p-5 space-y-5">
      <button type="button" className="underline min-h-[44px]" onClick={() => navigate('/settings')}>Back to settings</button>
      <h1 className="text-2xl font-bold">Organisation management</h1>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {message && <p role="status" className="text-green-800">{message}</p>}
      <form className="bg-white rounded-xl p-4 space-y-3" onSubmit={e => {
        e.preventDefault();
        void run(async () => {
          await api('/api/orgs', { method: 'POST', body: JSON.stringify({ name, kind }) });
          setName(''); setMessage('Organisation created. You are its administrator.');
        });
      }}>
        <h2 className="font-semibold">Create an organisation</h2>
        <label htmlFor="org-name">Organisation name</label>
        <input id="org-name" className="block border rounded-lg p-3 w-full" minLength={2} maxLength={120} required value={name} onChange={e => setName(e.target.value)}/>
        <label htmlFor="org-kind" className="block">Type</label>
        <select id="org-kind" className="block border rounded-lg p-3 w-full" value={kind} onChange={e => setKind(e.target.value)}>
          {['business', 'municipality', 'campus', 'hospital', 'nonprofit', 'other'].map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <Button type="submit" disabled={busy}>Create organisation</Button>
      </form>
      <section className="bg-white rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Manage an organisation</h2>
        <label htmlFor="managed-org">Your organisations</label>
        <select id="managed-org" className="block border rounded-lg p-3 w-full" value={selected} onChange={e => { setSelected(e.target.value); setQueueDesk(''); }}>
          <option value="">Select an organisation</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name} ({o.role})</option>)}
        </select>
        {orgs.length === 0 && <p>Create an organisation to get started.</p>}
        {current && <>
          <p className="text-sm">Your role: {current.role}</p>
          {current.role === 'admin' && <>
            <label htmlFor="desk-name" className="block">New service desk</label>
            <input id="desk-name" className="block border rounded-lg p-3 w-full" value={deskName} onChange={e => setDeskName(e.target.value)}/>
            <Button disabled={busy} onClick={() => void run(async () => {
              await api(`/api/orgs/${selected}/desks`, { method: 'POST', body: JSON.stringify({ name: deskName }) });
              setDeskName(''); setMessage('Service desk created.');
            })}>Add desk</Button>
            <label htmlFor="staff-id" className="block">Existing Unity user ID</label>
            <input id="staff-id" className="block border rounded-lg p-3 w-full" value={staffId} onChange={e => setStaffId(e.target.value)}/>
            <label htmlFor="staff-role" className="block">Role</label>
            <select id="staff-role" className="block border rounded-lg p-3 w-full" value={staffRole} onChange={e => setStaffRole(e.target.value as 'staff' | 'viewer')}>
              <option value="staff">Staff</option><option value="viewer">Viewer</option>
            </select>
            <Button variant="outline" disabled={busy} onClick={() => void run(async () => {
              await api(`/api/orgs/${selected}/members`, { method: 'POST', body: JSON.stringify({ userId: staffId, role: staffRole }) });
              setStaffId(''); setMessage('Staff member added.');
            })}>Add member</Button>
          </>}
          {current.role !== 'viewer' && <>
            <h3 className="font-semibold">Appointments</h3>
            {appointments.length === 0 && <p>No appointments.</p>}
            {appointments.map(a => <article key={a.id} className="border rounded-lg p-3 space-y-2">
              <p>{new Date(a.startsAt).toLocaleString()} · {a.status}</p><p className="text-xs">Visitor: {a.userId}</p>
              {a.status === 'booked' && <Button disabled={busy} onClick={() => void run(async () => {
                await api(`/api/orgs/${selected}/appointments/${a.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) });
                await refreshSelected(); setMessage('Appointment completed.');
              })}>Mark complete</Button>}
            </article>)}
            <h3 className="font-semibold">Service queue</h3>
            <label htmlFor="queue-desk">Desk</label>
            <select id="queue-desk" className="block border rounded-lg p-3 w-full" value={queueDesk} onChange={e => setQueueDesk(e.target.value)}>
              <option value="">Select desk</option>{current.desks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {queue.map(item => <article key={item.id} className="border rounded-lg p-3 space-y-2">
              <p>Position {item.position} · {item.status}</p>
              <p className="text-xs">Visitor: {item.visitorId}</p>
              <Button variant="outline" disabled={busy} onClick={() => void run(async () => {
                await api(`/api/desks/${queueDesk}/queue/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: item.status === 'waiting' ? 'active' : 'done' }) });
                await refreshSelected(); setMessage('Queue updated.');
              })}>{item.status === 'waiting' ? 'Call next' : 'Complete service'}</Button>
            </article>)}
            <Button variant="outline" onClick={() => void run(async () => { await refreshSelected(); setMessage('Records refreshed.'); })}>Refresh appointments and queue</Button>
          </>}
        </>}
      </section>
    </main>
  );
}
