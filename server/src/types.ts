export type CommPref = 'audio' | 'text' | 'video' | 'sign';
export type OtpPurpose = 'register' | 'login' | 'recovery';
export type ContactStatus = 'pending' | 'accepted' | 'blocked';
export type MessageType = 'text' | 'voice' | 'image' | 'video' | 'document' | 'sign' | 'system';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageSource = 'original' | 'transcription' | 'translation' | 'ai' | 'correction';
export type CallType = 'voice' | 'video';
export type CallStatus =
  | 'ringing'
  | 'accepted'
  | 'rejected'
  | 'busy'
  | 'missed'
  | 'ended'
  | 'reconnecting';
export type TranscriptSource = 'speech' | 'typed' | 'sign' | 'correction' | 'translation' | 'ai';
export type MediaKind = 'audio' | 'image' | 'video' | 'document' | 'sign';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  commPref: CommPref;
  discoverable: boolean;
  language: string;
  createdAt: string;
  deletedAt?: string;
}

export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
}

export interface OtpCode {
  id: string;
  destination: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: string;
  attempts: number;
  consumedAt?: string;
  createdAt: string;
}

export interface Preferences {
  userId: string;
  payload: Record<string, unknown>;
  updatedAt: string;
}

export interface Contact {
  id: string;
  ownerId: string;
  contactUserId: string;
  nickname?: string;
  status: ContactStatus;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  createdAt: string;
}

export interface ConversationMember {
  conversationId: string;
  userId: string;
  lastReadAt?: string;
  muted: boolean;
}

export interface MediaFile {
  id: string;
  ownerId: string;
  kind: MediaKind;
  path: string;
  mime: string;
  size: number;
  originalId?: string;
  altText?: string;
  transcript?: string;
  captions?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  body?: string;
  mediaId?: string;
  status: MessageStatus;
  clientId?: string;
  source: MessageSource;
  createdAt: string;
}

export interface CallRecord {
  id: string;
  conversationId?: string;
  initiatorId: string;
  calleeId: string;
  type: CallType;
  status: CallStatus;
  saveTranscript: boolean;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  createdAt: string;
}

export interface TranscriptSegment {
  id: string;
  callId: string;
  speakerId?: string;
  speakerName: string;
  text: string;
  source: TranscriptSource;
  createdAt: string;
}

export interface Block {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetUserId?: string;
  targetMessageId?: string;
  reason: string;
  details?: string;
  createdAt: string;
}

export interface Interpreter {
  id: string;
  userId: string;
  bio?: string;
  languages: string[];
  qualified: boolean;
  available: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  interpreterId: string;
  requesterId: string;
  startsAt: string;
  notes?: string;
  status: 'requested' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  joinToken: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  kind: string;
  description?: string;
  createdAt: string;
}

export interface ServiceDesk {
  id: string;
  orgId: string;
  name: string;
}

export interface QueueItem {
  id: string;
  deskId: string;
  visitorId: string;
  status: 'waiting' | 'active' | 'done' | 'transferred';
  position: number;
  createdAt: string;
}

export interface Appointment {
  id: string;
  orgId: string;
  userId: string;
  staffId?: string;
  startsAt: string;
  status: 'booked' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface GuestLink {
  id: string;
  token: string;
  purpose: string;
  targetId: string;
  createdBy?: string;
  expiresAt: string;
}

export interface TrainingConsent {
  userId: string;
  purpose: string;
  granted: boolean;
  updatedAt: string;
}

export interface StoreData {
  users: User[];
  sessions: Session[];
  otpCodes: OtpCode[];
  preferences: Preferences[];
  contacts: Contact[];
  conversations: Conversation[];
  members: ConversationMember[];
  media: MediaFile[];
  messages: Message[];
  calls: CallRecord[];
  transcripts: TranscriptSegment[];
  blocks: Block[];
  reports: Report[];
  interpreters: Interpreter[];
  bookings: Booking[];
  organizations: Organization[];
  desks: ServiceDesk[];
  queues: QueueItem[];
  appointments: Appointment[];
  guestLinks: GuestLink[];
  consents: TrainingConsent[];
}

export function emptyStore(): StoreData {
  return {
    users: [],
    sessions: [],
    otpCodes: [],
    preferences: [],
    contacts: [],
    conversations: [],
    members: [],
    media: [],
    messages: [],
    calls: [],
    transcripts: [],
    blocks: [],
    reports: [],
    interpreters: [],
    bookings: [],
    organizations: [],
    desks: [],
    queues: [],
    appointments: [],
    guestLinks: [],
    consents: []
  };
}

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    language: user.language,
    commPref: user.commPref,
    discoverable: user.discoverable
  };
}

export function privateUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    language: user.language,
    commPref: user.commPref,
    discoverable: user.discoverable,
    createdAt: user.createdAt
  };
}
