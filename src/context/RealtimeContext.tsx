import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useNavigate } from '../lib/router';
import { useAuth } from './AuthContext';
import { useAccessibility } from './AccessibilityContext';
import { useToast } from '../components/Toast';
import { realtime } from '../lib/socket';
import { announce, vibrate } from '../lib/haptics';
import type { CallRecord, ChatMessage } from '../lib/types';

interface IncomingCall {
  call: CallRecord;
  caller?: { id: string; name: string };
}

interface RealtimeContextType {
  incoming?: IncomingCall;
  lastMessage?: ChatMessage;
  online: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { vibrationEnabled, ttsEnabled } = useAccessibility();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState<IncomingCall>();
  const [lastMessage, setLastMessage] = useState<ChatMessage>();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const handlePayload = useCallback(
    (payload: Record<string, unknown>) => {
      if (payload.type === 'call:incoming') {
        const next = {
          call: payload.call as CallRecord,
          caller: payload.caller as { id: string; name: string }
        };
        setIncoming(next);
        announce(`Incoming ${next.call.type} call from ${next.caller?.name || 'someone'}`);
        if (vibrationEnabled) vibrate([200, 80, 200, 80, 400]);
        if (ttsEnabled) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(
            new SpeechSynthesisUtterance(`Incoming call from ${next.caller?.name || 'someone'}`)
          );
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Unity Call', {
            body: `${next.caller?.name || 'Someone'} is calling`
          });
        }
        navigate(`/calls/incoming/${next.call.id}`, { state: next });
      }
      if (payload.type === 'call:state') {
        const call = payload.call as CallRecord;
        if (['rejected', 'busy', 'missed', 'ended'].includes(call.status)) {
          setIncoming(undefined);
        }
      }
      if (payload.type === 'message') {
        const message = payload.message as ChatMessage;
        setLastMessage(message);
        if (message.senderId !== user?.id) {
          realtime.send({ type: 'message:received', messageId: message.id });
          addToast(`${message.senderName}: ${message.body || message.type}`, 'info');
          if (vibrationEnabled) vibrate(80);
        }
      }
      if (payload.type === 'contact:invite') {
        addToast('You have a new contact invitation. Open Contacts to respond.', 'info');
      }
      if (payload.type === 'contact:accepted') addToast('Your contact invitation was accepted. You can now chat.', 'success');
      if (payload.type === 'contact:declined') addToast('A contact invitation was declined.', 'info');
    },
    [addToast, navigate, ttsEnabled, user?.id, vibrationEnabled]
  );

  useEffect(() => {
    if (!user) return;
    realtime.connect();
    const unsubscribe = realtime.subscribe(handlePayload);
    return () => {
      unsubscribe();
    };
  }, [handlePayload, user]);

  const value = useMemo(
    () => ({ incoming, lastMessage, online }),
    [incoming, lastMessage, online]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used within a RealtimeProvider');
  return context;
}
