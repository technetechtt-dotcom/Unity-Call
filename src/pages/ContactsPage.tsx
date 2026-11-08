import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { api } from '../lib/api';
import { realtime } from '../lib/socket';

interface Contact {
  id: string;
  ownerId: string;
  contactUserId: string;
  direction: 'incoming' | 'outgoing';
  status: 'pending' | 'accepted' | 'blocked';
  user?: { id: string; name: string; language?: string };
}

export function ContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const refresh = async () => {
    const result = await api<{ contacts: Contact[] }>('/api/contacts');
    setContacts(result.contacts);
  };
  useEffect(() => {
    void refresh().catch(e => setError(e instanceof Error ? e.message : 'Unable to load contacts.')).finally(() => setLoading(false));
    const unsubscribe = realtime.subscribe(event => {
      if (['contact:invite','contact:accepted','contact:declined'].includes(String(event.type))) {
        void refresh().catch(() => setError('Unable to refresh contact invitations.'));
      }
    });
    return unsubscribe;
  }, []);

  const run = async (contact: Contact, action: 'accept' | 'decline' | 'chat' | 'block') => {
    setError(''); setMessage(''); setBusy(contact.id);
    try {
      if (action === 'chat') {
        if (!contact.user) throw new Error('Account unavailable.');
        const result = await api<{ conversation: { id: string } }>('/api/conversations', {
          method: 'POST', body: JSON.stringify({ userId: contact.user.id })
        });
        navigate(`/chats/${result.conversation.id}`);
        return;
      }
      if (action === 'block') {
        if (!contact.user) throw new Error('Account unavailable.');
        if (!window.confirm('Block this contact from messaging and calling you?')) return;
        await api(`/api/users/${contact.user.id}/block`, { method: 'POST' });
        setMessage('Contact blocked.');
      } else {
        await api(`/api/contacts/${contact.id}/${action}`, { method: 'POST' });
        setMessage(action === 'accept' ? 'Invitation accepted. You can now open a conversation.' : 'Invitation declined.');
      }
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update contact.'); }
    finally { setBusy(''); }
  };

  const incoming = contacts.filter(contact => contact.status === 'pending' && contact.direction === 'incoming');
  const outgoing = contacts.filter(contact => contact.status === 'pending' && contact.direction === 'outgoing');
  const accepted = contacts.filter(contact => contact.status === 'accepted');
  const blocked = contacts.filter(contact => contact.status === 'blocked');
  const heading = 'font-semibold text-lg mt-5 mb-2';
  const rowStyle = 'rounded-xl bg-white text-gray-900 shadow-sm p-4 space-y-2 break-words';
  const render = (items: Contact[], actions: Array<'accept' | 'decline' | 'chat' | 'block'>, empty: string) => items.length ? (
    <ul className="space-y-3">
      {items.map(contact => <li key={contact.id} className={rowStyle}>
        <p className="font-semibold">{contact.user?.name || 'Unavailable account'}</p>
        <p className="text-sm text-gray-600">{contact.user?.language || ''} · {contact.status} · {contact.direction}</p>
        <div className="flex flex-wrap gap-3">
          {actions.map(action => <button type="button" key={action} disabled={!!busy || !contact.user}
            className="min-h-[44px] rounded-lg border border-teal-700 px-4 py-2 text-teal-900 disabled:opacity-50"
            onClick={() => void run(contact, action)}>
            {busy === contact.id ? 'Updating…' : action === 'chat' ? 'Open chat' : action === 'block' ? 'Block' : action === 'accept' ? 'Accept' : 'Decline'}
          </button>)}
        </div>
      </li>)}
    </ul>
  ) : <p className="text-sm text-gray-600">{empty}</p>;

  return <main className="min-h-dvh max-w-xl mx-auto p-5 space-y-3 pb-24">
    <button type="button" className="underline min-h-[44px]" onClick={() => navigate('/chats')}>Back to chats</button>
    <h1 className="text-2xl font-bold">Contacts and invitations</h1>
    {loading && <p role="status">Loading contacts…</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {message && <p role="status" className="text-green-800">{message}</p>}
    <section aria-label="Incoming invitations"><h2 className={heading}>Invitations to respond to ({incoming.length})</h2>{render(incoming, ['accept','decline'], 'No incoming invitations.')}</section>
    <section aria-label="Sent invitations"><h2 className={heading}>Waiting for acceptance ({outgoing.length})</h2>{render(outgoing, [], 'No pending outgoing invitations.')}</section>
    <section aria-label="Accepted contacts"><h2 className={heading}>Accepted contacts ({accepted.length})</h2>{render(accepted, ['chat','block'], 'No accepted contacts yet.')}</section>
    <section aria-label="Blocked contacts"><h2 className={heading}>Blocked contacts ({blocked.length})</h2>{render(blocked, [], 'No blocked contacts.')}</section>
    <button type="button" className="underline min-h-[44px]" onClick={() => navigate('/chats/new')}>Find people</button>
  </main>;
}
