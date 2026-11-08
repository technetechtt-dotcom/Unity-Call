import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from '../lib/router';
import { ArrowLeft, Mic, Paperclip, Phone, Search, Send, StopCircle, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { useTTS } from '../hooks/useTTS';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { ChatBubble } from '../components/ChatBubble';
import { QuickReplies } from '../components/QuickReplies';
import { api, uploadMedia } from '../lib/api';
import { realtime } from '../lib/socket';
import { enqueueMessage, peekQueue, removeQueued } from '../lib/offlineQueue';
import type { ChatMessage, ConversationSummary } from '../lib/types';

export function ChatThreadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { highContrast, ttsEnabled } = useAccessibility();
  const { t } = useTranslation();
  const { speak } = useTTS();
  const recorder = useVoiceRecorder();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [conversation, setConversation] = useState<ConversationSummary>();
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [typing, setTyping] = useState(false);
  const historyRef = useRef<HTMLElement>(null);
  const followLatest = useRef(true);
  const prependPosition = useRef<{ height: number; top: number } | null>(null);

  const load = async () => {
    if (!id) return;
    const [inbox, list] = await Promise.all([
      api<{ messages: ChatMessage[]; nextCursor: string | null }>(`/api/conversations/${id}/messages?limit=30${search ? `&q=${encodeURIComponent(search)}` : ''}`),
      api<{ conversations: ConversationSummary[] }>('/api/conversations')
    ]);
    setMessages(inbox.messages);
    setNextCursor(inbox.nextCursor);
    setConversation(list.conversations.find((item) => item.id === id));
    await api(`/api/conversations/${id}/read`, { method: 'POST' });
  };

  useEffect(() => {
    setLoading(true); setError(''); followLatest.current = true;
    void load().catch(err => setError(err instanceof Error ? err.message : 'Failed to load conversation.')).finally(() => setLoading(false));
    // Reload when the conversation or search changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, search]);

  useEffect(() => {
    const unsubscribe = realtime.subscribe((payload) => {
      if (payload.type === 'message' && payload.conversationId === id) {
        setMessages((prev) => {
          const next = payload.message as ChatMessage;
          if (prev.some((item) => item.id === next.id || item.clientId === next.clientId)) {
            return prev.map((item) => (item.clientId === next.clientId ? next : item));
          }
          return [...prev, next];
        });
      }
      if (payload.type === 'message:deleted' && payload.conversationId === id) {
        setMessages(prev => prev.map(item => item.id === payload.messageId ? { ...item, type: 'system', body: undefined, media: undefined, mediaId: undefined } : item));
      }
      if (payload.type === 'typing' && payload.conversationId === id) {
        setTyping(true);
        window.setTimeout(() => setTyping(false), 2000);
      }
      if (payload.type === 'message:status' && payload.conversationId === id && payload.status === 'read' && !payload.messageId) {
        setMessages(prev => prev.map(item => item.senderId === user?.id && item.status !== 'failed' && item.status !== 'queued' ? { ...item, status: 'read' } : item));
      }
      if (payload.type === 'message:status' && payload.messageId) {
        setMessages((prev) =>
          prev.map((item) =>
            item.id === payload.messageId ? { ...item, status: payload.status as ChatMessage['status'] } : item
          )
        );
      }
    });
    return () => {
      unsubscribe();
    };
  }, [id, user?.id]);

  useLayoutEffect(() => {
    const history = historyRef.current;
    if (!history) return;
    const position = prependPosition.current;
    if (position) {
      history.scrollTop = position.top + history.scrollHeight - position.height;
      prependPosition.current = null;
    } else if (followLatest.current) {
      history.scrollTop = history.scrollHeight;
    }
  }, [messages, typing]);

  useEffect(() => {
    if (!ttsEnabled || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.senderId !== user?.id && last.body) speak(last.body);
  }, [messages, speak, ttsEnabled, user?.id]);

  useEffect(() => {
    if (!recorder.audioBlob || recorder.isRecording || !id) return;
    const upload = async () => {
      const uploaded = await uploadMedia(recorder.audioBlob as Blob, { kind: 'audio', filename: 'voice.webm' });
      const sent = await api<{ message: ChatMessage }>(`/api/conversations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'voice',
          mediaId: uploaded.media.id,
          body: 'Voice message'
        })
      });
      setMessages((prev) => [...prev, sent.message]);
      recorder.resetRecording();
    };
    void upload().catch(err => setError(err instanceof Error ? err.message : 'Voice message upload failed.'));
  }, [id, recorder.audioBlob, recorder.isRecording]);

  const flushQueue = async () => {
    if (!id || !user?.id || !navigator.onLine) return;
    for (const item of peekQueue(user.id).filter((entry) => entry.conversationId === id)) {
      try {
        const sent = await api<{ message: ChatMessage }>(`/api/conversations/${id}/messages`, {
          method: 'POST',
          body: JSON.stringify(item)
        });
        removeQueued(item.clientId);
        setMessages((prev) => prev.map((msg) => (msg.clientId === item.clientId ? sent.message : msg)));
      } catch {
        setMessages((prev) =>
          prev.map((msg) => (msg.clientId === item.clientId ? { ...msg, status: 'failed' } : msg))
        );
      }
    }
  };

  useEffect(() => {
    const onOnline = () => void flushQueue();
    window.addEventListener('online', onOnline);
    void flushQueue();
    return () => window.removeEventListener('online', onOnline);
  }, [id]);

  const loadOlder = async () => {
    if (!id || !nextCursor || loadingOlder) return;
    setLoadingOlder(true); setError('');
    try {
      const result = await api<{ messages: ChatMessage[]; nextCursor: string | null }>(`/api/conversations/${id}/messages?limit=30&before=${encodeURIComponent(nextCursor)}${search ? `&q=${encodeURIComponent(search)}` : ''}`);
      const history = historyRef.current;
      if (history) prependPosition.current = { height: history.scrollHeight, top: history.scrollTop };
      setMessages(previous => [...result.messages.filter(item => !previous.some(existing => existing.id === item.id)), ...previous]);
      setNextCursor(result.nextCursor);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load earlier messages.'); }
    finally { setLoadingOlder(false); }
  };

  const sendText = async (text = inputText) => {
    if (!id || !text.trim()) return;
    followLatest.current = true;
    const clientId = crypto.randomUUID();
    const optimistic: ChatMessage = {
      id: clientId,
      conversationId: id,
      senderId: user?.id || '',
      senderName: user?.name || 'You',
      type: 'text',
      body: text,
      status: navigator.onLine ? 'sent' : 'queued',
      clientId,
      source: 'original',
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimistic]);
    setInputText('');
    if (!navigator.onLine) {
      enqueueMessage({ userId: user?.id || '', clientId, conversationId: id, type: 'text', body: text, createdAt: optimistic.createdAt });
      return;
    }
    try {
      realtime.send({ type: 'typing', conversationId: id });
      const sent = await api<{ message: ChatMessage }>(`/api/conversations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ type: 'text', body: text, clientId })
      });
      setMessages((prev) => prev.map((msg) => (msg.clientId === clientId ? sent.message : msg)));
    } catch {
      enqueueMessage({ userId: user?.id || '', clientId, conversationId: id, type: 'text', body: text, createdAt: optimistic.createdAt });
      setMessages((prev) => prev.map((msg) => (msg.clientId === clientId ? { ...msg, status: 'failed' } : msg)));
    }
  };

  const attachFile = async (file: File) => {
    if (!id || mediaBusy) return;
    setMediaBusy(true); setError('');
    try {
    const kind = file.type.startsWith('image')
      ? 'image'
      : file.type.startsWith('video')
        ? 'video'
        : file.type.startsWith('audio')
          ? 'audio'
          : 'document';
    const altText =
      kind === 'image'
        ? window.prompt('Describe this photograph so it can be read aloud. Leave blank only if you will add a description later.') || ''
        : undefined;
    const uploaded = await uploadMedia(file, { kind, filename: file.name, altText });
    const sent = await api<{ message: ChatMessage }>(`/api/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        type: kind,
        mediaId: uploaded.media.id,
        body: file.name,
        source: 'original'
      })
    });
    setMessages((prev) => [...prev, sent.message]);
    } catch (err) { setError(err instanceof Error ? err.message : 'File upload failed. Please retry.'); }
    finally { setMediaBusy(false); }
  };

  const retry = async (message: ChatMessage) => {
    if (!id) return;
    try {
      if (message.clientId) {
        const sent = await api<{ message: ChatMessage }>(`/api/conversations/${id}/messages`, {
          method: 'POST', body: JSON.stringify({ type: message.type, body: message.body, clientId: message.clientId })
        });
        removeQueued(message.clientId);
        setMessages((prev) => prev.map((item) => (item.clientId === message.clientId ? sent.message : item)));
      } else {
        const sent = await api<{ message: ChatMessage }>(`/api/messages/${message.id}/retry`, { method: 'POST' });
        setMessages((prev) => prev.map((item) => (item.id === message.id ? sent.message : item)));
      }
    } catch { setMessages(prev => prev.map(item => item.id === message.id ? { ...item, status: 'failed' } : item)); }
  };

  const deleteMessage = async (message: ChatMessage) => {
    if (!window.confirm('Delete this message for everyone in this conversation?')) return;
    try {
      const result = await api<{ message: ChatMessage }>(`/api/messages/${message.id}`, { method: 'DELETE' });
      setMessages(prev => prev.map(item => item.id === message.id ? result.message : item));
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Could not delete message.'); }
  };

  const createGuestRoom = async () => {
    try {
      if (!user) return;
      const result = await api<{ url: string }>('/api/guest-links', { method: 'POST', body: JSON.stringify({ purpose: 'call', targetId: user.id }) });
      navigate(result.url);
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Unable to create guest room.'); }
  };

  const startCall = async (type: 'voice' | 'video') => {
    if (!conversation?.peer) return;
    const saveTranscript = window.confirm(
      'Save this call transcript on Unity? Captions still appear live if you say no. Only this call is saved if you say yes.'
    );
    const data = await api<{ call: { id: string } }>('/api/calls', {
      method: 'POST',
      body: JSON.stringify({
        userId: conversation.peer.id,
        type,
        saveTranscript
      })
    });
    navigate(`/calls/active/${data.call.id}`, { state: { outgoing: true, peerName: conversation.peer.name, callType: type } });
  };

  const visible = useMemo(
    () => messages.filter((msg) => !search || (msg.body || '').toLowerCase().includes(search.toLowerCase())),
    [messages, search]
  );

  return (
    <div className={`flex flex-col h-dvh ${highContrast ? 'bg-black text-white' : ''}`}>
      <header className={`px-3 py-3 flex items-center justify-between ${highContrast ? 'border-b-2 border-white' : 'bg-white shadow-sm'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" className="p-2 min-h-[48px]" aria-label={t('chat.back')} onClick={() => navigate('/chats')}>
            <ArrowLeft />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold truncate">{conversation?.peer?.name || 'Chat'}</h1>
            <p className="text-xs opacity-70">{conversation?.peer?.language || ''}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button type="button" className="p-2 min-h-[48px]" aria-label="Search this conversation" onClick={() => setSearch(prompt('Search messages') || '')}>
            <Search size={20} />
          </button>
          <button type="button" className="p-2 min-h-[48px] underline text-xs" onClick={() => void createGuestRoom()} aria-label="Create browser guest call invitation">Guest link</button>
          <button type="button" className="p-2 min-h-[48px]" aria-label={`Voice call ${conversation?.peer?.name || ''}`} onClick={() => void startCall('voice')}>
            <Phone size={20} />
          </button>
          <button type="button" className="p-2 min-h-[48px]" aria-label={`Video call ${conversation?.peer?.name || ''}`} onClick={() => void startCall('video')}>
            <Video size={20} />
          </button>
        </div>
      </header>

      <main ref={historyRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4" style={{ overflowAnchor: 'none' }} role="log" aria-label="Message history" onScroll={event => {
        const history = event.currentTarget;
        followLatest.current = history.scrollHeight - history.clientHeight - history.scrollTop < 80;
      }}>
        {error && <p role="alert" className="text-red-700 bg-white p-2 rounded mb-2">{error}</p>}
        {loading && <p role="status">Loading messages…</p>}
        {!loading && !error && visible.length === 0 && <p>{search ? 'No matching messages.' : 'No messages yet. Send the first message.'}</p>}
        {error && <button type="button" className="underline min-h-[44px]" onClick={() => {
          setLoading(true); setError('');
          void load().catch(err => setError(err instanceof Error ? err.message : 'Could not load messages.')).finally(() => setLoading(false));
        }}>Retry loading messages</button>}
        {nextCursor && <button type="button" className="underline min-h-[44px] mb-2" disabled={loadingOlder} onClick={() => void loadOlder()}>{loadingOlder ? 'Loading earlier messages…' : 'Load earlier messages'}</button>}
        {visible.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.body || msg.type}
            isSent={msg.senderId === user?.id}
            timestamp={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            type={msg.type === 'voice' ? 'voice' : 'text'}
            status={msg.status}
            source={msg.source}
            media={msg.media}
            onRetry={msg.status === 'failed' ? () => void retry(msg) : undefined}
            onDelete={msg.senderId === user?.id && msg.type !== 'system' && msg.status !== 'queued' ? () => void deleteMessage(msg) : undefined}
          />
        ))}
        {typing && <p className="text-sm opacity-70">{t('chat.typing')}</p>}
      </main>

      <footer className={`p-4 border-t ${highContrast ? 'border-white' : 'border-gray-200 bg-white'}`}>
        {!recorder.isRecording && (
          <QuickReplies
            onSelect={(text) => {
              setInputText(text);
              void sendText(text);
            }}
          />
        )}
        <form
          className="flex items-end gap-2 mt-2"
          onSubmit={(event) => {
            event.preventDefault();
            void sendText();
          }}
        >
          {recorder.isRecording ? (
            <p className="flex-1 py-3 text-red-600" aria-live="polite">
              Recording {recorder.duration}s. {recorder.error}
            </p>
          ) : (
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('chat.typeMessage')}
              className="flex-1 min-h-[48px] px-4 rounded-2xl bg-gray-100"
              aria-label={t('chat.typeMessage')}
            />
          )}
          <label className="p-3 rounded-full bg-gray-100 min-h-[48px] min-w-[48px] inline-flex items-center justify-center">
            <input
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,audio/webm,audio/ogg,audio/mpeg,audio/mp4,.pdf,.txt"
              aria-label="Attach a photo, video, or document"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void attachFile(file);
                event.currentTarget.value = '';
              }}
            />
            {mediaBusy ? <span role="status">Uploading…</span> : <Paperclip />}
          </label>
          {inputText && !recorder.isRecording ? (
            <button type="submit" className="p-3 rounded-full bg-primary text-white min-h-[48px]" aria-label={t('chat.send')}>
              <Send />
            </button>
          ) : (
            <button
              type="button"
              className="p-3 rounded-full bg-gray-200 min-h-[48px]"
              aria-pressed={recorder.isRecording}
              aria-label={recorder.isRecording ? t('chat.stopRecord') : t('chat.record')}
              onClick={() => (recorder.isRecording ? recorder.stopRecording() : void recorder.startRecording())}
            >
              {recorder.isRecording ? <StopCircle /> : <Mic />}
            </button>
          )}
        </form>
        {recorder.error && <p role="alert" className="text-sm text-red-600 mt-2">{recorder.error}</p>}
      </footer>
    </div>
  );
}
