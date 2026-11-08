import { useState } from 'react';
import { useNavigate } from '../lib/router';
import { ArrowLeft } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface FoundUser {
  id: string;
  name: string;
  language: string;
}

export function NewChatPage() {
  const { highContrast } = useAccessibility();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<FoundUser[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setUsers([]);
      return;
    }
    try {
      const data = await api<{ users: FoundUser[] }>(`/api/users/search?q=${encodeURIComponent(value)}`);
      setUsers(data.users);
    } catch (err) { setError(err instanceof Error ? err.message : 'Search unavailable.'); }
  };

  const start = async (userId: string) => {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api<{ status?: string }>('/api/contacts/invite', {
        method: 'POST', body: JSON.stringify({ userId })
      });
      if (result.status === 'accepted') {
        const created = await api<{ conversation: { id: string } }>('/api/conversations', {
          method: 'POST', body: JSON.stringify({ userId })
        });
        navigate(`/chats/${created.conversation.id}`);
      } else {
        setMessage('Invitation sent. You can start chatting after the person accepts. Check Contacts for its status.');
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not send invitation.'); }
    finally { setBusy(false); }
  };

  const inviteByDestination = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await api('/api/contacts/invite', {
        method: 'POST',
        body: JSON.stringify({ destination: query })
      });
      setMessage('Invitation request received. If this person has an eligible account, they can accept it in Contacts.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send invitation.');
    }
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <header className={`px-4 py-3 flex items-center gap-3 ${highContrast ? 'bg-gray-900 border-b-2 border-white' : 'bg-white shadow-sm'}`}>
        <button type="button" className="p-2 min-h-[48px]" aria-label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>
        <h1 className="font-bold text-lg">New chat</h1>
      </header>
      <main className="p-4 space-y-4">
        <Input
          label="Search people or invite by email/phone"
          value={query}
          onChange={(e) => void search(e.target.value)}
          helperText="People who hide discovery will not appear in search."
        />
        <form onSubmit={inviteByDestination}>
          <Button type="submit" fullWidth>Send invitation</Button>
        </form>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {message && <p role="status">{message}</p>}
        <button type="button" className="underline min-h-[44px]" onClick={() => navigate('/contacts')}>View invitations and contacts</button>
        <ul className="space-y-2">
          {users.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                className="w-full text-left p-4 rounded-xl bg-white shadow-sm min-h-[56px]"
                disabled={busy}
                onClick={() => void start(user.id)}
              >
                <strong>{user.name}</strong>
                <span className="block text-sm opacity-70">{user.language}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
