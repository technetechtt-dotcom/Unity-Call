export type CommPref = 'audio' | 'text' | 'video' | 'sign';
export type FontSize = 'normal' | 'large' | 'xlarge';
export type AppLanguage = 'English' | 'isiZulu' | 'Afrikaans' | 'isiXhosa';

export interface SessionUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  language: string;
  commPref: CommPref;
  discoverable: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  createdAt?: string;
  muted: boolean;
  peer?: { id: string; name: string; language: string };
  lastMessage?: {
    body?: string;
    type: string;
    createdAt: string;
    status: string;
  };
  unread: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: 'text' | 'voice' | 'image' | 'video' | 'document' | 'sign' | 'system';
  body?: string;
  mediaId?: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  clientId?: string;
  source: 'original' | 'transcription' | 'translation' | 'ai' | 'correction';
  createdAt: string;
  media?: {
    id: string;
    kind: string;
    mime: string;
    altText?: string;
    transcript?: string;
    captions?: string;
    url: string;
  };
}

export interface CallRecord {
  id: string;
  conversationId?: string;
  initiatorId: string;
  calleeId: string;
  type: 'voice' | 'video';
  status: string;
  saveTranscript: boolean;
  transcriptRequested?: boolean;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  createdAt: string;
  direction: 'incoming' | 'outgoing';
  peer: { id: string; name: string };
  hasTranscript?: boolean;
}

export interface TranscriptSegment {
  id: string;
  callId: string;
  speakerId?: string;
  speakerName: string;
  text: string;
  source: 'speech' | 'typed' | 'sign' | 'correction' | 'translation' | 'ai';
  createdAt: string;
}

export interface ContactRecord {
  id: string;
  ownerId: string;
  contactUserId: string;
  status: 'pending' | 'accepted' | 'blocked';
  user?: { id: string; name: string; language: string };
}

export const VALIDATED_SIGNS = [
  'HELLO',
  'YES',
  'NO',
  'THANK YOU',
  'PLEASE',
  'HELP',
  'NAME',
  'REPEAT',
  'SLOW'
] as const;

export type ValidatedSign = (typeof VALIDATED_SIGNS)[number];
