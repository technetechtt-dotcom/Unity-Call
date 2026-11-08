import { useEffect, useState } from 'react';
import { Link, useNavigate } from '../lib/router';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../context/AccessibilityContext';
import { useRealtime } from '../context/RealtimeContext';
import { BottomNav } from '../components/BottomNav';
import { api } from '../lib/api';
import type { ConversationSummary } from '../lib/types';

export function ChatListPage() {
  const { highContrast } = useAccessibility();
  const { lastMessage } = useRealtime();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ConversationSummary[]>([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await api<{ conversations: ConversationSummary[] }>('/api/conversations');
      setChats(data.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load conversations.');
    }
  };

  useEffect(() => {
    void load();
  }, [lastMessage]);

  const filtered = chats.filter((chat) => {
    const haystack = `${chat.peer?.name || ''} ${chat.lastMessage?.body || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="relative flex flex-col min-h-dvh pb-16">
      <header className={`px-6 py-4 sticky top-0 z-10 ${highContrast ? 'bg-gray-900 border-b-2 border-white' : 'bg-white shadow-sm'}`}>
        {searching ? (
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('home.search')}
              className="flex-1 min-h-[48px] px-4 rounded-full border-2"
              aria-label="Search conversations"
              autoFocus
            />
            <button type="button" onClick={() => { setSearching(false); setQuery(''); }}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t('home.title')}</h1>
            <button
              type="button"
              className="p-3 rounded-full min-h-[48px]"
              aria-label="Search conversations"
              onClick={() => setSearching(true)}
            >
              <Search size={24} />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {error && <p role="alert">{error}</p>}
        <button type="button" onClick={() => navigate("/contacts")} className="w-full rounded-xl border border-teal-700 p-3 font-semibold min-h-[48px] text-left">Contacts and pending invitations</button>
        {filtered.length === 0 && <p className="opacity-70">{t('home.noChats')}</p>}
        {filtered.map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => navigate(`/chats/${chat.id}`)}
            className={`w-full text-left p-4 rounded-2xl min-h-[72px] ${highContrast ? 'border-2 border-white' : 'bg-white shadow-sm'}`}
            aria-label={`Open chat with ${chat.peer?.name || 'contact'}. ${chat.unread} unread.`}
          >
            <div className="flex justify-between gap-3">
              <strong className="truncate">{chat.peer?.name || 'Conversation'}</strong>
              <span className="text-xs opacity-70">{chat.lastMessage ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
            <p className="text-sm truncate opacity-80">{chat.lastMessage?.body || chat.lastMessage?.type || 'No messages yet'}</p>
            {chat.unread > 0 && (
              <span className="inline-flex mt-2 px-2 rounded-full bg-accent text-white text-xs">{chat.unread} unread</span>
            )}
          </button>
        ))}
      </main>

      <Link
        to="/chats/new"
        className={`absolute bottom-20 right-4 px-4 py-3 rounded-full shadow-lg min-h-[48px] inline-flex items-center gap-2 ${highContrast ? 'bg-yellow-400 text-black' : 'bg-primary text-white'}`}
        aria-label="Start a new chat"
      >
        <Plus size={22} />
        {t('home.newChat')}
      </Link>
      <BottomNav />
    </div>
  );
}
