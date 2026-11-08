import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:net';
import test from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';

async function unusedPort() {
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>(resolve => server.close(() => resolve()));
  return port;
}

async function waitForServer(base: string) {
  for (let tries = 0; tries < 60; tries++) {
    try {
      const reply = await fetch(base + '/api/health');
      if (reply.ok) return;
    } catch { /* Server is still starting. */ }
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('Test API did not start.');
}

function openSocket(url: string, origin: string, cookie?: string) {
  return new Promise<WebSocket>((resolve, reject) => {
    const socket = new WebSocket(url, { headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}) } });
    socket.once('open', () => resolve(socket));
    socket.once('error', reject);
  });
}

function expectEvent(socket: WebSocket, type: string, timeout = 3000) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const timer = setTimeout(() => { socket.off('message', handler); reject(new Error('Timed out waiting for ' + type)); }, timeout);
    const handler = (data: WebSocket.RawData) => {
      const event = JSON.parse(data.toString()) as Record<string, unknown>;
      if (event.type !== type && (event.type === 'guest:error' || event.type === 'error')) {
        clearTimeout(timer);
        socket.off('message', handler);
        reject(new Error(String(event.error || JSON.stringify(event))));
        return;
      }
      if (event.type !== type) return;
      clearTimeout(timer);
      socket.off('message', handler);
      resolve(event);
    };
    socket.on('message', handler);
  });
}

test('guest invitation requires signed-in host and isolates a two-person relay', { timeout: 25000 }, async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'unity-guest-test-'));
  const port = await unusedPort();
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['--experimental-strip-types', 'server/src/index.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'development', PORT: String(port), DATA_DIR: directory },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverOutput = '';
  child.stdout?.on('data', chunk => { serverOutput += String(chunk); });
  child.stderr?.on('data', chunk => { serverOutput += String(chunk); });
  const clients: WebSocket[] = [];
  let phase = 'startup';
  try {
    try { await waitForServer(base); }
    catch (error) { throw new Error(`Guest test server failed to start: ${serverOutput || String(error)}`); }
    const post = async (url: string, body: unknown, cookie?: string) => {
      const reply = await fetch(base + url, {
        method: 'POST',
        headers: { Origin: base, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
        body: JSON.stringify(body)
      });
      if (!reply.ok) throw new Error(`POST ${url} failed: ${reply.status} ${await reply.text()}`);
      return reply;
    };
    const destination = 'guest-test@example.com';
    const otp = await (await post('/api/auth/otp/request', { destination, purpose: 'register' })).json() as { devCode: string };
    const verified = await post('/api/auth/otp/verify', { destination, purpose: 'register', code: otp.devCode, name: 'Host' });
    const cookie = verified.headers.get('set-cookie')?.split(';')[0];
    assert(cookie);
    const user = await verified.json() as { user: { id: string } };
    const created = await (await post('/api/guest-links', { purpose: 'call', targetId: user.user.id }, cookie)).json() as { link: { token: string } };
    const roomToken = created.link.token;
    const host = await openSocket(`ws://127.0.0.1:${port}/ws`, base, cookie);
    const guest = await openSocket(`ws://127.0.0.1:${port}/ws`, base);
    clients.push(host, guest);
    phase = 'host joins';
    const joinedHost = expectEvent(host, 'guest:joined');
    host.send(JSON.stringify({ type: 'guest:join', token: roomToken }));
    assert.equal((await joinedHost).role, 'host');
    phase = 'guest joins';
    const readyHost = expectEvent(host, 'guest:peer-ready');
    const readyGuest = expectEvent(guest, 'guest:peer-ready');
    const joinedGuest = expectEvent(guest, 'guest:joined');
    guest.send(JSON.stringify({ type: 'guest:join', token: roomToken }));
    assert.equal((await joinedGuest).role, 'guest');
    await Promise.all([readyHost, readyGuest]);
    phase = 'message relay';
    const received = expectEvent(guest, 'guest:text');
    host.send(JSON.stringify({ type: 'guest:text', text: 'Accessible reply' }));
    assert.equal((await received).text, 'Accessible reply');
    phase = 'third participant rejected';
    const third = await openSocket(`ws://127.0.0.1:${port}/ws`, base);
    clients.push(third);
    const error = expectEvent(third, 'guest:error');
    third.send(JSON.stringify({ type: 'guest:join', token: roomToken }));
    assert.match(String((await error).error), /already has a participant/);
    phase = 'invalid invitation rejected';
    const bad = await openSocket(`ws://127.0.0.1:${port}/ws`, base);
    clients.push(bad);
    const invalid = expectEvent(bad, 'guest:error');
    bad.send(JSON.stringify({ type: 'guest:join', token: 'invalid-token' }));
    assert.match(String((await invalid).error), /invalid or expired/);
    phase = 'two-user contact lifecycle';
    const secondDestination = 'second-test@example.com';
    const secondOtp = await (await post('/api/auth/otp/request', { destination: secondDestination, purpose: 'register' })).json() as { devCode: string };
    const secondResponse = await post('/api/auth/otp/verify', { destination: secondDestination, purpose: 'register', code: secondOtp.devCode, name: 'Second user' });
    const secondCookie = secondResponse.headers.get('set-cookie')?.split(';')[0];
    assert(secondCookie);
    const second = await secondResponse.json() as { user: { id: string } };
    const earlyConversation = await fetch(base + '/api/conversations', {
      method: 'POST', headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: second.user.id })
    });
    assert.equal(earlyConversation.status, 400, 'unapproved conversation creation must fail');
    const invited = await post('/api/contacts/invite', { userId: second.user.id }, cookie);
    assert.equal((await invited.json() as { status: string }).status, 'pending');
    const secondContacts = await (await fetch(base + '/api/contacts', { headers: { Cookie: secondCookie } })).json() as { contacts: Array<{ id: string; direction: string; status: string }> };
    const invitation = secondContacts.contacts.find(item => item.direction === 'incoming' && item.status === 'pending');
    assert(invitation, 'recipient must see pending invite');
    await post(`/api/contacts/${invitation.id}/accept`, {}, secondCookie);
    const accepted = await (await fetch(base + '/api/contacts', { headers: { Cookie: cookie } })).json() as { contacts: Array<{ status: string }> };
    assert(accepted.contacts.some(item => item.status === 'accepted'), 'sender must see accepted contact');
    const conversationResponse = await post('/api/conversations', { userId: second.user.id }, cookie);
    const conversation = await conversationResponse.json() as { conversation: { id: string } };
    const sent = await (await post(`/api/conversations/${conversation.conversation.id}/messages`, { type: 'text', body: 'Hello from integration test', clientId: 'integration-1' }, cookie)).json() as { message: { id: string } };
    const messagesResponse = await fetch(base + `/api/conversations/${conversation.conversation.id}/messages`, { headers: { Cookie: secondCookie } });
    assert.equal(messagesResponse.status, 200);
    const messages = await messagesResponse.json() as { messages: Array<{ id: string }> };
    assert(messages.messages.some(item => item.id === sent.message.id), 'recipient can read message');
    const outsiderStatus = await fetch(base + `/api/messages/${sent.message.id}/retry`, {
      method: 'POST', headers: { Origin: base, Cookie: secondCookie, 'Content-Type': 'application/json' },
      body: '{}'
    });
    assert.equal(outsiderStatus.status, 400, 'recipient cannot forge sender retry status');
    await post(`/api/conversations/${conversation.conversation.id}/read`, {}, secondCookie);
    const senderMessages = await (await fetch(base + `/api/conversations/${conversation.conversation.id}/messages`, { headers: { Cookie: cookie } })).json() as { messages: Array<{ id: string; status: string }> };
    assert(senderMessages.messages.some(item => item.id === sent.message.id && item.status === 'read'), 'read receipt persists');
    await post(`/api/users/${second.user.id}/block`, {}, cookie);
    const blockedPost = await fetch(base + `/api/conversations/${conversation.conversation.id}/messages`, {
      method: 'POST', headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'text', body: 'Must be blocked' })
    });
    assert.equal(blockedPost.ok, false, 'blocked participants may not send new messages');

  } catch (error) {
    throw new Error(`${phase}: ${error instanceof Error ? error.message : String(error)}; server log: ${serverOutput.slice(-3500)}`);
  } finally {
    for (const client of clients) client.terminate();
    child.kill('SIGTERM');
    rmSync(directory, { recursive: true, force: true });
  }
});
