import { createHash, randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';

function hashSecret(value: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(value, salt, 32).toString('hex')}`;
}

function verifySecret(value: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const next = scryptSync(value, salt, 32);
  const prev = Buffer.from(hash, 'hex');
  return prev.length === next.length && timingSafeEqual(prev, next);
}
import {
  emptyStore,
  type Appointment,
  type Booking,
  type CallRecord,
  type CallStatus,
  type CommPref,
  type Contact,
  type Interpreter,
  type MediaFile,
  type MediaKind,
  type Message,
  type MessageSource,
  type MessageStatus,
  type MessageType,
  type Organization,
  type OtpPurpose,
  type Preferences,
  type QueueItem,
  type StoreData,
  type TranscriptSegment,
  type TranscriptSource,
  type User
} from './types.ts';

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const STORE_PATH = path.join(DATA_DIR, 'unity.json');

function now() {
  return new Date().toISOString();
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function seedOrganizations(store: StoreData) {
  if (store.organizations.length > 0) return;
  const campus: Organization = {
    id: 'org_campus',
    name: 'Unity Campus Pilot',
    kind: 'campus',
    description: 'Accessible student services desk for the controlled Unity pilot.',
    createdAt: now()
  };
  const city: Organization = {
    id: 'org_city',
    name: 'Municipal Access Desk',
    kind: 'municipality',
    description: 'Walk-in and remote service desk for licensing, billing, and appointments.',
    createdAt: now()
  };
  store.organizations.push(campus, city);
  store.desks.push(
    { id: 'desk_campus_reg', orgId: campus.id, name: 'Registration' },
    { id: 'desk_campus_aid', orgId: campus.id, name: 'Financial Aid' },
    { id: 'desk_city_lic', orgId: city.id, name: 'Licensing' },
    { id: 'desk_city_bill', orgId: city.id, name: 'Accounts' }
  );
}

export class Database {
  private store: StoreData;

  constructor() {
    mkdirSync(DATA_DIR, { recursive: true });
    mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
    if (existsSync(STORE_PATH)) {
      this.store = { ...emptyStore(), ...JSON.parse(readFileSync(STORE_PATH, 'utf8')) };
    } else {
      this.store = emptyStore();
    }
    seedOrganizations(this.store);
    this.persist();
  }

  private persist() {
    const tmp = `${STORE_PATH}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.store, null, 2));
    renameSync(tmp, STORE_PATH);
  }

  get uploadRoot() {
    return path.join(DATA_DIR, 'uploads');
  }

  createOtp(destination: string, purpose: OtpPurpose) {
    const recent = this.store.otpCodes.filter(
      (o) => o.destination === destination && Date.now() - Date.parse(o.createdAt) < 60 * 60 * 1000
    );
    if (recent.length >= 5) {
      throw new Error('Too many codes requested. Wait before trying again.');
    }
    const code = String(randomInt(100000, 1000000));
    const record = {
      id: randomUUID(),
      destination: destination.trim().toLowerCase(),
      purpose,
      codeHash: hashSecret(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attempts: 0,
      createdAt: now()
    };
    this.store.otpCodes.push(record);
    this.persist();
    return { id: record.id, code, expiresAt: record.expiresAt };
  }

  verifyOtp(destination: string, purpose: OtpPurpose, code: string) {
    const dest = destination.trim().toLowerCase();
    const otp = [...this.store.otpCodes]
      .reverse()
      .find((o) => o.destination === dest && o.purpose === purpose && !o.consumedAt);
    if (!otp) throw new Error('No active code. Request a new one.');
    if (Date.parse(otp.expiresAt) < Date.now()) throw new Error('That code has expired.');
    otp.attempts += 1;
    if (otp.attempts > 5) throw new Error('Too many attempts. Request a new code.');
    if (!verifySecret(code, otp.codeHash)) {
      this.persist();
      throw new Error('Incorrect code.');
    }
    otp.consumedAt = now();
    this.persist();
    return true;
  }

  findUserByDestination(destination: string) {
    const dest = destination.trim().toLowerCase();
    return this.store.users.find(
      (u) => !u.deletedAt && (u.email === dest || u.phone === dest)
    );
  }

  getUser(id: string) {
    return this.store.users.find((u) => u.id === id && !u.deletedAt);
  }

  createUser(input: {
    name: string;
    email?: string;
    phone?: string;
    language?: string;
    commPref?: CommPref;
  }) {
    if (input.email && this.findUserByDestination(input.email)) {
      throw new Error('An account already uses that email.');
    }
    if (input.phone && this.findUserByDestination(input.phone)) {
      throw new Error('An account already uses that phone number.');
    }
    const user: User = {
      id: randomUUID(),
      name: input.name.trim(),
      email: input.email?.trim().toLowerCase(),
      phone: input.phone?.trim().toLowerCase(),
      commPref: input.commPref || 'text',
      discoverable: true,
      language: input.language || 'English',
      createdAt: now()
    };
    this.store.users.push(user);
    this.store.preferences.push({ userId: user.id, payload: {}, updatedAt: now() });
    this.persist();
    return user;
  }

  updateUser(id: string, patch: Partial<Pick<User, 'name' | 'commPref' | 'discoverable' | 'language' | 'email' | 'phone'>>) {
    const user = this.getUser(id);
    if (!user) throw new Error('Account not found.');
    Object.assign(user, patch);
    this.persist();
    return user;
  }

  createSession(userId: string, userAgent?: string) {
    const token = randomBytes(32).toString('hex');
    const session = {
      id: randomUUID(),
      userId,
      tokenHash: hashToken(token),
      userAgent,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now()
    };
    this.store.sessions.push(session);
    this.persist();
    return { token, session };
  }

  getSessionUser(token?: string) {
    if (!token) return undefined;
    const hash = hashToken(token);
    const session = this.store.sessions.find(
      (s) => s.tokenHash === hash && Date.parse(s.expiresAt) > Date.now()
    );
    if (!session) return undefined;
    return this.getUser(session.userId);
  }

  revokeSession(token: string) {
    const hash = hashToken(token);
    this.store.sessions = this.store.sessions.filter((s) => s.tokenHash !== hash);
    this.persist();
  }

  listSessions(userId: string, currentToken?: string) {
    return this.store.sessions.filter((s) => s.userId === userId && Date.parse(s.expiresAt) > Date.now()).map((s) => ({ id: s.id, userAgent: s.userAgent, createdAt: s.createdAt, expiresAt: s.expiresAt, current: !!currentToken && s.tokenHash === hashToken(currentToken) }));
  }

  revokeSessionById(userId: string, sessionId: string) {
    const count = this.store.sessions.length;
    this.store.sessions = this.store.sessions.filter((s) => !(s.userId === userId && s.id === sessionId));
    if (this.store.sessions.length === count) throw new Error('Session not found.');
    this.persist();
  }

  exportAccount(userId: string) {
    const user = this.getUser(userId);
    if (!user) throw new Error('Account not found.');
    const ownConversations = new Set(this.store.members.filter((m) => m.userId === userId).map((m) => m.conversationId));
    const ownCalls = new Set(this.store.calls.filter((c) => c.initiatorId === userId || c.calleeId === userId).map((c) => c.id));
    return { exportedAt: now(), user, preferences: this.getPreferences(userId).payload, contacts: this.listContacts(userId), messages: this.store.messages.filter((m) => ownConversations.has(m.conversationId)), calls: this.listCalls(userId), transcripts: this.store.transcripts.filter((t) => ownCalls.has(t.callId)), media: this.store.media.filter((m) => m.ownerId === userId).map(({ path: _path, ...m }) => m), bookings: this.listBookings(userId), appointments: this.store.appointments.filter((a) => a.userId === userId), consents: this.store.consents.filter((c) => c.userId === userId) };
  }

  revokeUserSessions(userId: string) {
    this.store.sessions = this.store.sessions.filter((s) => s.userId !== userId);
    this.persist();
  }

  deleteAccount(userId: string) {
    const user = this.getUser(userId);
    if (!user) return;
    user.deletedAt = now();
    user.email = undefined;
    user.phone = undefined;
    user.name = 'Deleted account';
    this.revokeUserSessions(userId);
    this.store.preferences = this.store.preferences.filter((p) => p.userId !== userId);
    for (const media of this.store.media.filter((m) => m.ownerId === userId)) {
      try { if (existsSync(media.path)) unlinkSync(media.path); } catch (error) { console.error('Media removal failed', media.id, error); }
    }
    const removedConversations = new Set(this.store.members.filter((m) => m.userId === userId).map((m) => m.conversationId));
    const removedCalls = new Set(this.store.calls.filter((c) => c.initiatorId === userId || c.calleeId === userId).map((c) => c.id));
    this.store.media = this.store.media.filter((m) => m.ownerId !== userId);
    this.store.messages = this.store.messages.filter((m) => m.senderId !== userId && !removedConversations.has(m.conversationId));
    this.store.members = this.store.members.filter((m) => !removedConversations.has(m.conversationId));
    this.store.conversations = this.store.conversations.filter((c) => !removedConversations.has(c.id));
    this.store.calls = this.store.calls.filter((c) => !removedCalls.has(c.id));
    this.store.transcripts = this.store.transcripts.filter((t) => !removedCalls.has(t.callId) && t.speakerId !== userId);
    this.store.contacts = this.store.contacts.filter((c) => c.ownerId !== userId && c.contactUserId !== userId);
    this.store.blocks = this.store.blocks.filter((b) => b.blockerId !== userId && b.blockedId !== userId);
    this.store.reports = this.store.reports.filter((r) => r.reporterId !== userId && r.targetUserId !== userId);
    this.store.interpreters = this.store.interpreters.filter((i) => i.userId !== userId);
    this.store.bookings = this.store.bookings.filter((b) => b.requesterId !== userId);
    this.store.queues = this.store.queues.filter((q) => q.visitorId !== userId);
    this.store.appointments = this.store.appointments.filter((a) => a.userId !== userId);
    this.store.guestLinks = this.store.guestLinks.filter((g) => g.createdBy !== userId);
    this.store.consents = this.store.consents.filter((c) => c.userId !== userId);
    this.store.otpCodes = this.store.otpCodes.filter((o) => o.destination !== user.email && o.destination !== user.phone);
    this.persist();
  }

  getPreferences(userId: string): Preferences {
    let pref = this.store.preferences.find((p) => p.userId === userId);
    if (!pref) {
      pref = { userId, payload: {}, updatedAt: now() };
      this.store.preferences.push(pref);
      this.persist();
    }
    return pref;
  }

  savePreferences(userId: string, payload: Record<string, unknown>) {
    const pref = this.getPreferences(userId);
    pref.payload = { ...pref.payload, ...payload };
    pref.updatedAt = now();
    this.persist();
    return pref;
  }

  searchUsers(query: string, requesterId: string) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const blocked = this.blockedSet(requesterId);
    return this.store.users
      .filter(
        (u) =>
          !u.deletedAt &&
          u.id !== requesterId &&
          u.discoverable &&
          !blocked.has(u.id) &&
          (u.name.toLowerCase().includes(q) ||
            u.email === q ||
            u.phone === q)
      )
      .slice(0, 20)
      .map((u) => ({
        id: u.id,
        name: u.name,
        language: u.language
      }));
  }

  blockedSet(userId: string) {
    const set = new Set<string>();
    for (const block of this.store.blocks) {
      if (block.blockerId === userId) set.add(block.blockedId);
      if (block.blockedId === userId) set.add(block.blockerId);
    }
    return set;
  }

  isBlocked(a: string, b: string) {
    return this.store.blocks.some(
      (block) =>
        (block.blockerId === a && block.blockedId === b) ||
        (block.blockerId === b && block.blockedId === a)
    );
  }

  listContacts(userId: string) {
    return this.store.contacts
      .filter((c) => c.ownerId === userId || c.contactUserId === userId)
      .map((c) => {
        const otherId = c.ownerId === userId ? c.contactUserId : c.ownerId;
        const other = this.getUser(otherId);
        return {
          ...c,
          user: other
            ? { id: other.id, name: other.name, language: other.language }
            : undefined
        };
      });
  }

  inviteContact(ownerId: string, targetId: string) {
    if (ownerId === targetId) throw new Error('You cannot add yourself.');
    if (this.isBlocked(ownerId, targetId)) throw new Error('This person is unavailable.');
    const existing = this.store.contacts.find(
      (c) =>
        (c.ownerId === ownerId && c.contactUserId === targetId) ||
        (c.ownerId === targetId && c.contactUserId === ownerId)
    );
    if (existing) return existing;
    const contact: Contact = {
      id: randomUUID(),
      ownerId,
      contactUserId: targetId,
      status: 'pending',
      createdAt: now()
    };
    this.store.contacts.push(contact);
    this.persist();
    return contact;
  }

  acceptContact(userId: string, contactId: string) {
    const contact = this.store.contacts.find((c) => c.id === contactId);
    if (!contact || contact.contactUserId !== userId) throw new Error('Invitation not found.');
    contact.status = 'accepted';
    this.persist();
    this.getOrCreateConversation(userId, contact.ownerId);
    return contact;
  }

  blockUser(blockerId: string, blockedId: string) {
    if (!this.store.blocks.some((b) => b.blockerId === blockerId && b.blockedId === blockedId)) {
      this.store.blocks.push({ blockerId, blockedId, createdAt: now() });
    }
    for (const contact of this.store.contacts) {
      if (
        (contact.ownerId === blockerId && contact.contactUserId === blockedId) ||
        (contact.ownerId === blockedId && contact.contactUserId === blockerId)
      ) {
        contact.status = 'blocked';
      }
    }
    this.persist();
  }

  report(input: {
    reporterId: string;
    targetUserId?: string;
    targetMessageId?: string;
    reason: string;
    details?: string;
  }) {
    const report = {
      id: randomUUID(),
      createdAt: now(),
      ...input
    };
    this.store.reports.push(report);
    this.persist();
    return report;
  }

  getOrCreateConversation(a: string, b: string) {
    if (!a || !b || a === b || !this.getUser(a) || !this.getUser(b)) throw new Error('Invalid conversation participants.');
    if (this.isBlocked(a, b)) throw new Error('This person is unavailable.');
    const accepted = this.store.contacts.some((c) => c.status === 'accepted' && ((c.ownerId === a && c.contactUserId === b) || (c.ownerId === b && c.contactUserId === a)));
    if (!accepted) throw new Error('The contact invitation must be accepted first.');
    const existing = this.store.conversations.find((conv) => {
      const members = this.store.members.filter((m) => m.conversationId === conv.id);
      const ids = members.map((m) => m.userId).sort();
      return conv.type === 'dm' && ids.length === 2 && ids[0] === [a, b].sort()[0] && ids[1] === [a, b].sort()[1];
    });
    if (existing) return existing;
    const conversation = { id: randomUUID(), type: 'dm' as const, createdAt: now() };
    this.store.conversations.push(conversation);
    this.store.members.push(
      { conversationId: conversation.id, userId: a, muted: false },
      { conversationId: conversation.id, userId: b, muted: false }
    );
    this.persist();
    return conversation;
  }

  assertMember(conversationId: string, userId: string) {
    const member = this.store.members.find(
      (m) => m.conversationId === conversationId && m.userId === userId
    );
    if (!member) throw new Error('You do not have access to this conversation.');
    return member;
  }

  listConversations(userId: string) {
    return this.store.members
      .filter((m) => m.userId === userId)
      .map((m) => {
        const conversation = this.store.conversations.find((c) => c.id === m.conversationId);
        const members = this.store.members.filter((x) => x.conversationId === m.conversationId);
        const other = members
          .map((x) => this.getUser(x.userId))
          .filter((u): u is User => !!u && u.id !== userId);
        const messages = this.store.messages
          .filter((msg) => msg.conversationId === m.conversationId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const last = messages[messages.length - 1];
        const unread = messages.filter(
          (msg) => msg.senderId !== userId && (!m.lastReadAt || msg.createdAt > m.lastReadAt)
        ).length;
        return {
          id: m.conversationId,
          createdAt: conversation?.createdAt,
          muted: m.muted,
          peer: other[0]
            ? { id: other[0].id, name: other[0].name, language: other[0].language }
            : undefined,
          lastMessage: last
            ? {
                body: last.body,
                type: last.type,
                createdAt: last.createdAt,
                status: last.status
              }
            : undefined,
          unread
        };
      })
      .sort((a, b) => (b.lastMessage?.createdAt || '').localeCompare(a.lastMessage?.createdAt || ''));
  }

  listMessages(conversationId: string, userId: string, query?: string) {
    this.assertMember(conversationId, userId);
    let rows = this.store.messages.filter((m) => m.conversationId === conversationId);
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter((m) => (m.body || '').toLowerCase().includes(q));
    }
    return rows
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((m) => this.hydrateMessage(m));
  }

  hydrateMessage(message: Message) {
    const media = message.mediaId
      ? this.store.media.find((m) => m.id === message.mediaId)
      : undefined;
    const sender = this.getUser(message.senderId);
    return {
      ...message,
      senderName: sender?.name || 'Member',
      media: media
        ? {
            id: media.id,
            kind: media.kind,
            mime: media.mime,
            altText: media.altText,
            transcript: media.transcript,
            captions: media.captions,
            url: `/api/media/${media.id}`
          }
        : undefined
    };
  }

  createMessage(input: {
    conversationId: string;
    senderId: string;
    type: MessageType;
    body?: string;
    mediaId?: string;
    clientId?: string;
    source?: MessageSource;
  }) {
    this.assertMember(input.conversationId, input.senderId);
    if (input.mediaId && !this.store.media.some((m) => m.id === input.mediaId && m.ownerId === input.senderId)) throw new Error('Attachment not found or not owned by sender.');
    if (input.body && input.body.length > 10000) throw new Error('Message too long.');
    const members = this.store.members.filter((m) => m.conversationId === input.conversationId);
    const other = members.find((m) => m.userId !== input.senderId);
    if (other && this.isBlocked(input.senderId, other.userId)) {
      throw new Error('This conversation is blocked.');
    }
    if (input.clientId) {
      const dup = this.store.messages.find(
        (m) => m.senderId === input.senderId && m.clientId === input.clientId
      );
      if (dup) return this.hydrateMessage(dup);
    }
    const message: Message = {
      id: randomUUID(),
      conversationId: input.conversationId,
      senderId: input.senderId,
      type: input.type,
      body: input.body,
      mediaId: input.mediaId,
      status: 'sent',
      clientId: input.clientId,
      source: input.source || 'original',
      createdAt: now()
    };
    this.store.messages.push(message);
    this.persist();
    return this.hydrateMessage(message);
  }

  updateMessageStatus(id: string, userId: string, status: MessageStatus) {
    const message = this.store.messages.find((m) => m.id === id);
    if (!message) throw new Error('Message not found.');
    this.assertMember(message.conversationId, userId);
    message.status = status;
    this.persist();
    return this.hydrateMessage(message);
  }

  markRead(conversationId: string, userId: string) {
    const member = this.assertMember(conversationId, userId);
    member.lastReadAt = now();
    for (const message of this.store.messages) {
      if (message.conversationId === conversationId && message.senderId !== userId) {
        message.status = 'read';
      }
    }
    this.persist();
  }

  createMedia(input: {
    ownerId: string;
    kind: MediaKind;
    path: string;
    mime: string;
    size: number;
    originalId?: string;
    altText?: string;
    transcript?: string;
    captions?: string;
  }) {
    const media: MediaFile = {
      id: randomUUID(),
      createdAt: now(),
      ...input
    };
    this.store.media.push(media);
    this.persist();
    return media;
  }

  getMediaForUser(id: string, userId: string) {
    const media = this.store.media.find((m) => m.id === id);
    if (!media) return undefined;
    if (media.ownerId === userId) return media;
    const used = this.store.messages.find((m) => m.mediaId === id);
    if (used) {
      try {
        this.assertMember(used.conversationId, userId);
        return media;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  updateMedia(id: string, userId: string, patch: Partial<Pick<MediaFile, 'altText' | 'transcript' | 'captions'>>) {
    const media = this.getMediaForUser(id, userId);
    if (!media || media.ownerId !== userId) throw new Error('File not found or not owned by you.');
    Object.assign(media, patch);
    this.persist();
    return media;
  }

  createCall(input: {
    initiatorId: string;
    calleeId: string;
    type: 'voice' | 'video';
    saveTranscript: boolean;
  }) {
    if (!this.getUser(input.initiatorId) || !this.getUser(input.calleeId) || input.initiatorId === input.calleeId) throw new Error('Invalid call participants.');
    if (this.isBlocked(input.initiatorId, input.calleeId)) {
      throw new Error('This person is unavailable.');
    }
    const ringing = this.store.calls.find(
      (c) =>
        c.calleeId === input.calleeId &&
        (c.status === 'ringing' || c.status === 'accepted' || c.status === 'reconnecting')
    );
    if (ringing) throw Object.assign(new Error('User is busy'), { code: 'busy' });
    const conversation = this.getOrCreateConversation(input.initiatorId, input.calleeId);
    const call: CallRecord = {
      id: randomUUID(),
      conversationId: conversation.id,
      initiatorId: input.initiatorId,
      calleeId: input.calleeId,
      type: input.type,
      status: 'ringing',
      saveTranscript: input.saveTranscript,
      createdAt: now()
    };
    this.store.calls.push(call);
    this.persist();
    return call;
  }

  getCall(id: string) {
    return this.store.calls.find((c) => c.id === id);
  }

  assertCallParticipant(call: CallRecord, userId: string) {
    if (call.initiatorId !== userId && call.calleeId !== userId) {
      throw new Error('You are not part of this call.');
    }
  }

  updateCall(id: string, userId: string, status: CallStatus) {
    const call = this.getCall(id);
    if (!call) throw new Error('Call not found.');
    this.assertCallParticipant(call, userId);
    call.status = status;
    if (status === 'accepted') call.startedAt = now();
    if (['rejected', 'busy', 'missed', 'ended'].includes(status)) {
      call.endedAt = now();
      if (call.startedAt) {
        call.durationSeconds = Math.max(
          0,
          Math.round((Date.parse(call.endedAt) - Date.parse(call.startedAt)) / 1000)
        );
      }
    }
    this.persist();
    return call;
  }

  listCalls(userId: string) {
    return this.store.calls
      .filter((c) => c.initiatorId === userId || c.calleeId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((call) => {
        const otherId = call.initiatorId === userId ? call.calleeId : call.initiatorId;
        const other = this.getUser(otherId);
        return {
          ...call,
          direction: call.initiatorId === userId ? 'outgoing' : 'incoming',
          peer: other ? { id: other.id, name: other.name } : { id: otherId, name: 'Unknown' },
          hasTranscript: this.store.transcripts.some((t) => t.callId === call.id)
        };
      });
  }

  addTranscript(input: Omit<TranscriptSegment, 'id' | 'createdAt'> & { userId: string }) {
    const call = this.getCall(input.callId);
    if (!call) throw new Error('Call not found.');
    this.assertCallParticipant(call, input.userId);
    if (!call.saveTranscript && input.source !== 'correction') {
      // Live captions may still be exchanged over the socket; only persist when opted in.
    }
    const segment: TranscriptSegment = {
      id: randomUUID(),
      callId: input.callId,
      speakerId: input.speakerId,
      speakerName: input.speakerName,
      text: input.text,
      source: input.source,
      createdAt: now()
    };
    if (call.saveTranscript) {
      this.store.transcripts.push(segment);
      this.persist();
    }
    return segment;
  }

  listTranscript(callId: string, userId: string) {
    const call = this.getCall(callId);
    if (!call) throw new Error('Call not found.');
    this.assertCallParticipant(call, userId);
    if (!call.saveTranscript) return [];
    return this.store.transcripts
      .filter((t) => t.callId === callId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  listInterpreters() {
    return this.store.interpreters.map((i) => {
      const user = this.getUser(i.userId);
      return {
        ...i,
        name: user?.name || 'Interpreter',
        language: user?.language
      };
    });
  }

  upsertInterpreter(userId: string, input: { bio?: string; languages?: string[]; available?: boolean }) {
    let interpreter = this.store.interpreters.find((i) => i.userId === userId);
    if (!interpreter) {
      interpreter = {
        id: randomUUID(),
        userId,
        bio: input.bio,
        languages: input.languages || ['SASL', 'English'],
        qualified: false,
        available: !!input.available,
        createdAt: now()
      };
      this.store.interpreters.push(interpreter);
    } else {
      Object.assign(interpreter, input);
    }
    this.persist();
    return interpreter;
  }

  bookInterpreter(requesterId: string, interpreterId: string, startsAt: string, notes?: string) {
    const interpreter = this.store.interpreters.find((i) => i.id === interpreterId);
    if (!interpreter || !interpreter.qualified || !interpreter.available) throw new Error('Interpreter is not verified or available.');
    if (!Number.isFinite(Date.parse(startsAt)) || Date.parse(startsAt) <= Date.now()) throw new Error('Choose a future appointment.');
    if (this.store.bookings.some((b) => b.interpreterId === interpreterId && ['requested', 'accepted'].includes(b.status) && Math.abs(Date.parse(b.startsAt) - Date.parse(startsAt)) < 60 * 60 * 1000)) throw new Error('Interpreter already has a request in this time slot.');
    const booking: Booking = {
      id: randomUUID(),
      interpreterId,
      requesterId,
      startsAt,
      notes,
      status: 'requested',
      joinToken: randomBytes(12).toString('hex'),
      createdAt: now()
    };
    this.store.bookings.push(booking);
    this.persist();
    return booking;
  }

  updateBooking(userId: string, bookingId: string, status: Booking['status']) {
    const booking = this.store.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found.');
    const interpreter = this.store.interpreters.find((i) => i.id === booking.interpreterId);
    const isInterpreter = interpreter?.userId === userId;
    if (!isInterpreter && booking.requesterId !== userId) throw new Error('Booking not found.');
    if (status === 'cancelled') {
      if (booking.requesterId !== userId || !['requested','accepted'].includes(booking.status)) throw new Error('Cannot cancel this booking.');
    } else if (!isInterpreter || !({ accepted: ['requested'], declined: ['requested'], completed: ['accepted'] } as Record<string, string[]>)[status]?.includes(booking.status)) throw new Error('Invalid booking state transition.');
    booking.status = status;
    this.persist();
    return booking;
  }

  listBookings(userId: string) {
    const interpreterIds = this.store.interpreters
      .filter((i) => i.userId === userId)
      .map((i) => i.id);
    return this.store.bookings.filter(
      (b) => b.requesterId === userId || interpreterIds.includes(b.interpreterId)
    );
  }

  listOrganizations() {
    return this.store.organizations.map((org) => ({
      ...org,
      desks: this.store.desks.filter((d) => d.orgId === org.id)
    }));
  }

  joinQueue(userId: string, deskId: string) {
    const desk = this.store.desks.find((d) => d.id === deskId);
    if (!desk) throw new Error('Service desk not found.');
    const waiting = this.store.queues.filter((q) => q.deskId === deskId && q.status === 'waiting');
    const item: QueueItem = {
      id: randomUUID(),
      deskId,
      visitorId: userId,
      status: 'waiting',
      position: waiting.length + 1,
      createdAt: now()
    };
    this.store.queues.push(item);
    this.persist();
    return item;
  }

  listAppointments(userId: string) { return this.store.appointments.filter((a) => a.userId === userId); }

  cancelAppointment(userId: string, id: string) {
    const appointment = this.store.appointments.find((a) => a.id === id && a.userId === userId);
    if (!appointment || appointment.status !== 'booked') throw new Error('Booking not found.');
    appointment.status = 'cancelled'; this.persist(); return appointment;
  }

  createAppointment(userId: string, orgId: string, startsAt: string) {
    const org = this.store.organizations.find((o) => o.id === orgId);
    if (!org) throw new Error('Organisation not found.');
    if (!Number.isFinite(Date.parse(startsAt)) || Date.parse(startsAt) <= Date.now()) throw new Error('Choose a future appointment.');
    if (this.store.appointments.some((a) => a.orgId === orgId && a.userId === userId && a.status === 'booked' && Math.abs(Date.parse(a.startsAt) - Date.parse(startsAt)) < 30 * 60 * 1000)) throw new Error('You already booked this time slot.');
    const appointment: Appointment = {
      id: randomUUID(),
      orgId,
      userId,
      startsAt,
      status: 'booked',
      createdAt: now()
    };
    this.store.appointments.push(appointment);
    this.persist();
    return appointment;
  }

  createGuestLink(userId: string, purpose: string, targetId: string) {
    const link: GuestLink = {
      id: randomUUID(),
      token: randomBytes(12).toString('hex'),
      purpose,
      targetId,
      createdBy: userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    this.store.guestLinks.push(link);
    this.persist();
    return link;
  }

  getGuestLink(token: string) {
    const link = this.store.guestLinks.find((g) => g.token === token);
    if (!link || Date.parse(link.expiresAt) < Date.now()) return undefined;
    return link;
  }

  setConsent(userId: string, purpose: string, granted: boolean) {
    const existing = this.store.consents.find((c) => c.userId === userId);
    if (existing) {
      existing.purpose = purpose;
      existing.granted = granted;
      existing.updatedAt = now();
    } else {
      this.store.consents.push({ userId, purpose, granted, updatedAt: now() });
    }
    this.persist();
    return this.store.consents.find((c) => c.userId === userId);
  }
}

export const db = new Database();
