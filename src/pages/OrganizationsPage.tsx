import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';

interface Org {
  id: string;
  name: string;
  kind: string;
  description?: string;
  desks: { id: string; name: string }[];
}

export function OrganizationsPage() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [qr, setQr] = useState('');

  useEffect(() => {
    void api<{ organizations: Org[] }>('/api/orgs').then((data) => setOrgs(data.organizations));
  }, []);

  const makeLink = async (orgId: string) => {
    const data = await api<{ url: string; link: { token: string } }>('/api/guest-links', {
      method: 'POST',
      body: JSON.stringify({ purpose: 'org', targetId: orgId })
    });
    const joinUrl = `${window.location.origin}${data.url}`;
    setQr(`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl)}`);
  };

  return (
    <div className="min-h-dvh">
      <header className="px-4 py-3 flex items-center gap-3 bg-white shadow-sm">
        <button type="button" className="p-2" aria-label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>
        <h1 className="font-bold">Organisation directory</h1>
      </header>
      <main className="p-5 space-y-4">
        <p>
          Service desks, queues, appointments, and browser joining are ready for a participating campus or municipality after the consumer app is stable. Prices should follow measured staff and interpreter costs.
        </p>
        {orgs.map((org) => (
          <article key={org.id} className="p-4 rounded-xl bg-white shadow-sm space-y-2">
            <h2 className="font-bold">{org.name}</h2>
            <p className="text-sm opacity-70">{org.kind}</p>
            <p>{org.description}</p>
            {org.desks.map((desk) => (
              <Button
                key={desk.id}
                variant="secondary"
                onClick={() => void api(`/api/desks/${desk.id}/queue`, { method: 'POST' })}
              >
                Join {desk.name} queue
              </Button>
            ))}
            <Button onClick={() => void api(`/api/orgs/${org.id}/appointments`, { method: 'POST', body: JSON.stringify({ startsAt: new Date(Date.now() + 86400000).toISOString() }) })}>
              Book appointment
            </Button>
            <Button variant="outline" onClick={() => void makeLink(org.id)}>Create guest QR</Button>
          </article>
        ))}
        {qr && <img src={qr} alt="QR code for browser joining without installing Unity" />}
      </main>
    </div>
  );
}
