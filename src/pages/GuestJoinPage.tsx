import { useEffect, useState } from 'react';
import { useParams } from '../lib/router';
import { api } from '../lib/api';

export function GuestJoinPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('Checking invitation…');

  useEffect(() => {
    if (!token) return;
    void api<{ link: { purpose: string; expiresAt: string } }>(`/api/guest/${token}`)
      .then((data) => {
        setStatus(`Guest invitation for ${data.link.purpose}. This page works in a browser with no Unity install. Camera and microphone are requested only if you join media.`);
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : 'Invitation unavailable.'));
  }, [token]);

  return (
    <main className="min-h-dvh p-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-4">Join Unity as a guest</h1>
      <p className="text-lg">{status}</p>
    </main>
  );
}
