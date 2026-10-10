import { mkdirSync, writeFileSync } from 'node:fs';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from './db.ts';
import { createApp, createHttpServer, json, type Req } from './http.ts';
import { privateUser } from './types.ts';
import { MiniSocket, upgradeWebSocket } from './ws.ts';

const PORT = Number(process.env.PORT || 8787);
const DEV = process.env.NODE_ENV !== 'production';
mkdirSync(db.uploadRoot, { recursive: true });

type SocketClient = MiniSocket;
const sockets = new Map<string, Set<SocketClient>>();

function sendTo(userId: string, payload: unknown) {
  const set = sockets.get(userId);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const socket of set) {
    if (socket.readyState === socket.OPEN) socket.send(data);
  }
}

function tokenFrom(req: Req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return undefined;
}

function requireUser(req: Req) {
  const user = db.getSessionUser(tokenFrom(req));
  if (!user) throw Object.assign(new Error('Please sign in again.'), { status: 401 });
  req.userId = user.id;
  return user;
}

function dest(body: Record<string, unknown>) {
  return String(body.destination || body.email || body.phone || '').trim().toLowerCase();
}

const app = createApp();

app.get('/api/health', (_req, res) => {
  json(res, 200, { ok: true, service: 'unity-call', time: new Date().toISOString() });
});

app.get('/api/ice', (_req, res) => {
  const ice: Array<Record<string, string | string[]>> = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];
  if (process.env.TURN_URLS) {
    ice.push({
      urls: process.env.TURN_URLS.split(','),
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_PASSWORD || ''
    });
  }
  json(res, 200, { iceServers: ice, turnConfigured: Boolean(process.env.TURN_URLS) });
});

app.post('/api/auth/otp/request', (req, res) => {
  const destination = dest(req.body);
  const purpose = req.body.purpose as 'register' | 'login' | 'recovery';
  if (!destination || !purpose) return json(res, 400, { error: 'Enter a phone number or email.' });
  const existing = db.findUserByDestination(destination);
  if (purpose === 'register' && existing) return json(res, 409, { error: 'That account already exists. Sign in instead.' });
  if ((purpose === 'login' || purpose === 'recovery') && !existing) {
    return json(res, 404, { error: 'No account found for that phone or email.' });
  }
  const otp = db.createOtp(destination, purpose);
  json(res, 200, {
    ok: true,
    expiresAt: otp.expiresAt,
    delivery: 'development',
    ...(DEV ? { devCode: otp.code } : {})
  });
});

app.post('/api/auth/otp/verify', (req, res) => {
  const destination = dest(req.body);
  db.verifyOtp(destination, req.body.purpose as 'register' | 'login' | 'recovery', String(req.body.code || ''));
  let user = db.findUserByDestination(destination);
  if (req.body.purpose === 'register') {
    if (user) return json(res, 409, { error: 'That account already exists.' });
    user = db.createUser({
      name: String(req.body.name || 'Unity member'),
      email: destination.includes('@') ? destination : undefined,
      phone: destination.includes('@') ? undefined : destination,
      language: req.body.language as string | undefined,
      commPref: req.body.commPref as 'audio' | 'text' | 'video' | 'sign' | undefined
    });
  }
  if (!user) return json(res, 404, { error: 'Account not found.' });
  const { token } = db.createSession(user.id, req.headers['user-agent']);
  json(res, 200, { token, user: privateUser(user), preferences: db.getPreferences(user.id).payload });
});

app.post('/api/auth/logout', (req, res) => {
  requireUser(req);
  const token = tokenFrom(req);
  if (token) db.revokeSession(token);
  json(res, 200, { ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { user: privateUser(user), preferences: db.getPreferences(user.id).payload });
});

app.delete('/api/auth/account', (req, res) => {
  const user = requireUser(req);
  db.deleteAccount(user.id);
  json(res, 200, { ok: true });
});

app.patch('/api/users/me', (req, res) => {
  const user = requireUser(req);
  json(res, 200, {
    user: privateUser(db.updateUser(user.id, {
      name: req.body.name as string | undefined,
      commPref: req.body.commPref as 'audio' | 'text' | 'video' | 'sign' | undefined,
      discoverable: req.body.discoverable as boolean | undefined,
      language: req.body.language as string | undefined
    }))
  });
});

app.patch('/api/users/me/preferences', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { preferences: db.savePreferences(user.id, req.body).payload });
});

app.get('/api/users/search', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { users: db.searchUsers(req.query.q || '', user.id) });
});

app.get('/api/contacts', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { contacts: db.listContacts(user.id) });
});

app.post('/api/contacts/invite', (req, res) => {
  const user = requireUser(req);
  let targetId = req.body.userId as string | undefined;
  if (!targetId && req.body.destination) {
    const found = db.findUserByDestination(String(req.body.destination));
    if (!found) return json(res, 404, { error: 'No Unity account uses that phone or email yet.' });
    targetId = found.id;
  }
  if (!targetId) return json(res, 400, { error: 'Choose a person to invite.' });
  const contact = db.inviteContact(user.id, targetId);
  sendTo(targetId, { type: 'contact:invite', contact });
  json(res, 200, { contact });
});

app.post('/api/contacts/:id/accept', (req, res) => {
  const user = requireUser(req);
  const contact = db.acceptContact(user.id, req.params.id);
  sendTo(contact.ownerId, { type: 'contact:accepted', contact });
  json(res, 200, { contact });
});

app.post('/api/users/:id/block', (req, res) => {
  const user = requireUser(req);
  db.blockUser(user.id, req.params.id);
  json(res, 200, { ok: true });
});

app.post('/api/reports', (req, res) => {
  const user = requireUser(req);
  json(res, 200, {
    report: db.report({
      reporterId: user.id,
      targetUserId: req.body.targetUserId as string | undefined,
      targetMessageId: req.body.targetMessageId as string | undefined,
      reason: String(req.body.reason || 'unspecified'),
      details: req.body.details as string | undefined
    })
  });
});

app.get('/api/conversations', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { conversations: db.listConversations(user.id) });
});

app.post('/api/conversations', (req, res) => {
  const user = requireUser(req);
  const conversation = db.getOrCreateConversation(user.id, String(req.body.userId));
  json(res, 200, { conversation, conversations: db.listConversations(user.id) });
});

app.get('/api/conversations/:id/messages', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { messages: db.listMessages(req.params.id, user.id, req.query.q) });
});

app.post('/api/conversations/:id/read', (req, res) => {
  const user = requireUser(req);
  db.markRead(req.params.id, user.id);
  const conversation = db.listConversations(user.id).find((item) => item.id === req.params.id);
  if (conversation?.peer) sendTo(conversation.peer.id, { type: 'message:status', conversationId: req.params.id, status: 'read' });
  json(res, 200, { ok: true });
});

app.post('/api/conversations/:id/messages', (req, res) => {
  const user = requireUser(req);
  const message = db.createMessage({
    conversationId: req.params.id,
    senderId: user.id,
    type: (req.body.type as 'text') || 'text',
    body: req.body.body as string | undefined,
    mediaId: req.body.mediaId as string | undefined,
    clientId: req.body.clientId as string | undefined,
    source: req.body.source as 'original' | undefined
  });
  const conversation = db.listConversations(user.id).find((item) => item.id === req.params.id);
  if (conversation?.peer) {
    sendTo(conversation.peer.id, { type: 'message', message, conversationId: req.params.id });
    db.updateMessageStatus(message.id, user.id, 'delivered');
    sendTo(user.id, { type: 'message:status', messageId: message.id, status: 'delivered' });
  }
  json(res, 200, { message });
});

app.post('/api/messages/:id/retry', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { message: db.updateMessageStatus(req.params.id, user.id, 'sent') });
});

app.post('/api/media', (req, res) => {
  const user = requireUser(req);
  const data = String(req.body.data || '');
  if (!data) return json(res, 400, { error: 'Choose a file to upload.' });
  const buffer = Buffer.from(data, 'base64');
  const ext = String(req.body.filename || 'file.bin').split('.').pop() || 'bin';
  const filename = `${Date.now()}-${randomUUID()}.${ext}`;
  const destPath = path.join(db.uploadRoot, filename);
  writeFileSync(destPath, buffer);
  const kind = (req.body.kind as 'audio' | 'image' | 'video' | 'document' | 'sign') || 'document';
  const media = db.createMedia({
    ownerId: user.id,
    kind,
    path: destPath,
    mime: String(req.body.mime || 'application/octet-stream'),
    size: buffer.length,
    originalId: req.body.originalId as string | undefined,
    altText: req.body.altText as string | undefined,
    transcript: req.body.transcript as string | undefined,
    captions: req.body.captions as string | undefined
  });
  json(res, 200, {
    media: { id: media.id, kind: media.kind, mime: media.mime, altText: media.altText, transcript: media.transcript, captions: media.captions, url: `/api/media/${media.id}` }
  });
});

app.get('/api/media/:id', (req, res) => {
  const user = requireUser(req);
  const media = db.getMediaForUser(req.params.id, user.id);
  if (!media || !existsSync(media.path)) return json(res, 404, { error: 'File not found or you do not have access.' });
  res.writeHead(200, { 'Content-Type': media.mime, 'Access-Control-Allow-Origin': '*' });
  createReadStream(media.path).pipe(res);
});

app.patch('/api/media/:id', (req, res) => {
  const user = requireUser(req);
  json(res, 200, {
    media: db.updateMedia(req.params.id, user.id, {
      altText: req.body.altText as string | undefined,
      transcript: req.body.transcript as string | undefined,
      captions: req.body.captions as string | undefined
    })
  });
});

app.get('/api/calls', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { calls: db.listCalls(user.id) });
});

app.post('/api/calls', (req, res) => {
  const user = requireUser(req);
  try {
    const call = db.createCall({
      initiatorId: user.id,
      calleeId: String(req.body.userId),
      type: (req.body.type as 'voice' | 'video') || 'voice',
      saveTranscript: Boolean(req.body.saveTranscript)
    });
    sendTo(call.calleeId, { type: 'call:incoming', call, caller: { id: user.id, name: user.name } });
    json(res, 200, { call });
  } catch (error) {
    if (error instanceof Error && 'code' in error) return json(res, 409, { error: 'The other person is busy.', code: 'busy' });
    throw error;
  }
});

app.post('/api/calls/:id/:action', (req, res) => {
  const user = requireUser(req);
  const action = req.params.action;
  const status =
    action === 'accept' ? 'accepted' :
    action === 'reject' ? 'rejected' :
    action === 'busy' ? 'busy' :
    action === 'missed' ? 'missed' :
    action === 'reconnect' ? 'reconnecting' : 'ended';
  const call = db.updateCall(req.params.id, user.id, status);
  const otherId = call.initiatorId === user.id ? call.calleeId : call.initiatorId;
  sendTo(otherId, { type: 'call:state', call });
  sendTo(user.id, { type: 'call:state', call });
  json(res, 200, { call });
});

app.get('/api/calls/:id/transcript', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { segments: db.listTranscript(req.params.id, user.id) });
});

app.post('/api/calls/:id/transcript', (req, res) => {
  const user = requireUser(req);
  const segment = db.addTranscript({
    callId: req.params.id,
    userId: user.id,
    speakerId: user.id,
    speakerName: String(req.body.speakerName || user.name),
    text: String(req.body.text || ''),
    source: req.body.source as 'speech'
  });
  const call = db.getCall(req.params.id);
  if (call) {
    const otherId = call.initiatorId === user.id ? call.calleeId : call.initiatorId;
    sendTo(otherId, { type: 'call:caption', callId: call.id, segment });
  }
  json(res, 200, { segment });
});

app.get('/api/interpreters', (req, res) => {
  requireUser(req);
  json(res, 200, {
    interpreters: db.listInterpreters(),
    notice: 'Unity books paid Deaf/SASL advisers and qualified interpreters. Profiles are requested, then independently verified before they appear as qualified.'
  });
});

app.post('/api/interpreters', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { interpreter: db.upsertInterpreter(user.id, req.body) });
});

app.post('/api/interpreters/:id/book', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { booking: db.bookInterpreter(user.id, req.params.id, String(req.body.startsAt), req.body.notes as string | undefined) });
});

app.get('/api/bookings', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { bookings: db.listBookings(user.id) });
});

app.get('/api/orgs', (req, res) => {
  requireUser(req);
  json(res, 200, { organizations: db.listOrganizations() });
});

app.post('/api/orgs/:id/appointments', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { appointment: db.createAppointment(user.id, req.params.id, String(req.body.startsAt)) });
});

app.post('/api/desks/:id/queue', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { item: db.joinQueue(user.id, req.params.id) });
});

app.post('/api/guest-links', (req, res) => {
  const user = requireUser(req);
  const link = db.createGuestLink(user.id, String(req.body.purpose || 'call'), String(req.body.targetId || user.id));
  json(res, 200, { link, url: `/join/${link.token}` });
});

app.get('/api/guest/:token', (req, res) => {
  const link = db.getGuestLink(req.params.token);
  if (!link) return json(res, 404, { error: 'This invitation has expired.' });
  json(res, 200, { link });
});

app.post('/api/consent', (req, res) => {
  const user = requireUser(req);
  json(res, 200, { consent: db.setConsent(user.id, String(req.body.purpose || 'sasl-training'), Boolean(req.body.granted)) });
});

app.get('/api/legal/privacy', (_req, res) => {
  json(res, 200, {
    title: 'Privacy information',
    sections: [
      'Unity stores account, conversation, call, and preference data only for the signed-in user and people they choose to contact.',
      'Communication preferences stay private. We never publish disability status.',
      'Transcripts are saved only when you opt in during a call.',
      'Media files are access-checked on every download.',
      'You can delete your account, which removes contact details and stored media.'
    ]
  });
});

app.get('/api/legal/terms', (_req, res) => {
  json(res, 200, {
    title: 'Terms of use',
    sections: [
      'Unity is an inclusive communication service. Harassment, impersonation, and non-consensual recording are not allowed.',
      'Sign recognition is limited and experimental. Do not rely on it for emergencies.',
      'Interpreter bookings require independently verified qualifications before paid work.',
      'Organisation tools are for participating institutions after the consumer app is stable.'
    ]
  });
});

app.get('/api/legal/help', (_req, res) => {
  json(res, 200, {
    title: 'Accessible help',
    sections: [
      'Sign in with a phone number or email and a one-time code.',
      'New Chat searches people who allow discovery. They must accept before you can message.',
      'Calls can be voice or video. Mute turns off your microphone. Captions come from each speaker’s own speech.',
      'Save transcript is optional and explained before the call starts.',
      'If a file is an image, add a description. Unity can suggest one only when you ask.'
    ]
  });
});

const server = createHttpServer(app, (req, socket) => {
  if (req.url !== '/ws') {
    socket.destroy();
    return;
  }
  const client = upgradeWebSocket(req, socket);
  if (!client) return;
  client.on('message', (raw) => {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (payload.type === 'auth') {
      const user = db.getSessionUser(String(payload.token || ''));
      if (!user) {
        client.send(JSON.stringify({ type: 'error', error: 'Invalid session.' }));
        return;
      }
      client.userId = user.id;
      if (!sockets.has(user.id)) sockets.set(user.id, new Set());
      sockets.get(user.id)!.add(client);
      client.send(JSON.stringify({ type: 'ready', userId: user.id }));
      return;
    }
    if (!client.userId) return;
    const userId = client.userId;
    if (payload.type === 'typing' && payload.conversationId) {
      const conversation = db.listConversations(userId).find((item) => item.id === payload.conversationId);
      if (conversation?.peer) sendTo(conversation.peer.id, { type: 'typing', conversationId: payload.conversationId, userId });
    }
    if (payload.type === 'call:signal' && payload.callId) {
      const call = db.getCall(String(payload.callId));
      if (!call) return;
      const otherId = call.initiatorId === userId ? call.calleeId : call.initiatorId;
      sendTo(otherId, { type: 'call:signal', callId: call.id, signal: payload.signal, from: userId });
    }
    if (payload.type === 'call:action' && payload.callId) {
      const call = db.getCall(String(payload.callId));
      if (!call) return;
      const otherId = call.initiatorId === userId ? call.calleeId : call.initiatorId;
      sendTo(otherId, { type: 'call:action', callId: call.id, action: payload.action, value: payload.value, from: userId });
    }
    if (payload.type === 'call:tts' && payload.callId) {
      const call = db.getCall(String(payload.callId));
      if (!call) return;
      const otherId = call.initiatorId === userId ? call.calleeId : call.initiatorId;
      sendTo(otherId, { type: 'call:tts', callId: call.id, text: payload.text, from: userId });
    }
  });
  client.on('close', () => {
    if (client.userId) sockets.get(client.userId)?.delete(client);
  });
});

server.listen(PORT, () => {
  console.log(`Unity Call API listening on http://localhost:${PORT}`);
});
