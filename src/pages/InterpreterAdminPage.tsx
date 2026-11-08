import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { api } from '../lib/api';

interface Interpreter {
  id: string;
  name: string;
  bio?: string;
  userId: string;
  qualified: boolean;
  available: boolean;
  reviewStatus?: string;
  reviewedAt?: string;
  languages: string[];
}

export function InterpreterAdminPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Interpreter[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const reload = async () => {
    const data = await api<{ interpreters: Interpreter[] }>('/api/admin/interpreters');
    setItems(data.interpreters);
  };
  useEffect(() => {
    void reload().catch(e => setError(e instanceof Error ? e.message : 'Unable to access verification dashboard.')).finally(() => setLoading(false));
  }, []);

  const review = async (id: string, decision: 'approved' | 'rejected' | 'suspended') => {
    if (!window.confirm(`Mark this interpreter as ${decision}? Verify evidence independently before approving.`)) return;
    setBusy(id); setError(''); setMessage('');
    try {
      await api(`/api/admin/interpreters/${id}/review`, { method: 'PATCH', body: JSON.stringify({ decision }) });
      await reload();
      setMessage(`Interpreter review recorded: ${decision}.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Review failed.'); }
    finally { setBusy(''); }
  };

  return <main className="min-h-dvh max-w-3xl mx-auto p-5 pb-20 space-y-4">
    <button type="button" className="underline min-h-[44px]" onClick={() => navigate('/settings')}>Back to settings</button>
    <h1 className="text-2xl font-bold">Interpreter verification</h1>
    <p>Restricted to the verified accounts configured in PLATFORM_ADMIN_EMAILS. Do not approve without inspecting valid qualifications outside the platform.</p>
    {loading && <p role="status">Loading applications…</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!loading && !error && items.length === 0 && <p>No interpreter applications.</p>}
    <ul className="space-y-3">
      {items.map(item => <li key={item.id} className="rounded-xl bg-white text-gray-900 p-4 shadow-sm space-y-2">
        <h2 className="font-semibold text-lg">{item.name}</h2>
        <p className="text-sm">Applicant: {item.userId}</p>
        <p className="text-sm">{item.languages.join(', ')}</p>
        <p className="whitespace-pre-wrap break-words">{item.bio || 'No supporting experience supplied.'}</p>
        <p className="text-sm">Review: {item.reviewStatus || 'pending'} · {item.qualified ? 'Verified' : 'Not verified'} · {item.available ? 'Available' : 'Unavailable'}</p>
        <div className="flex flex-wrap gap-2">
          {(['approved', 'rejected', 'suspended'] as const).map(decision => <button
            key={decision} type="button" disabled={!!busy}
            className="border rounded-lg p-3 min-h-[44px] disabled:opacity-50"
            onClick={() => void review(item.id, decision)}
          >{busy === item.id ? 'Saving…' : decision === 'approved' ? 'Approve' : decision === 'rejected' ? 'Reject' : 'Suspend'}</button>)}
        </div>
      </li>)}
    </ul>
  </main>;
}
