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
  try {
    try { await waitForServer(base); }
    catch (error) { throw new Error(`Guest test server failed to start: ${serverOutput || String(error)}`); }
    const post = async (url: string, body: unknown, cookie?: string) => {
      const reply = await fetch(base + url, {
        method: 'POST',
        headers: { Origin: base, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
        body: JSON.stringify(body)
      });
      assert(reply.ok, `POST ${url} failed: ${reply.status} ${await reply.text()}`);
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
    const joinedHost = expectEvent(host, 'guest:joined');
    host.send(JSON.stringify({ type: 'guest:join', token: roomToken }));
    assert.equal((await joinedHost).role, 'host');
    const readyHost = expectEvent(host, 'guest:peer-ready');
    const readyGuest = expectEvent(guest, 'guest:peer-ready');
    const joinedGuest = expectEvent(guest, 'guest:joined');
    guest.send(JSON.stringify({ type: 'guest:join', token: roomToken }));
    assert.equal((await joinedGuest).role, 'guest');
    await Promise.all([readyHost, readyGuest]);
    const received = expectEvent(guest, 'guest:text');
    host.send(JSON.stringify({ type: 'guest:text', text: 'Accessible reply' }));
    assert.equal((await received).text, 'Accessible reply');
    const third = await openSocket(`ws://127.0.0.1:${port}/ws`, base);
    clients.push(third);
    const error = expectEvent(third, 'guest:error');
    third.send(JSON.stringify({ type: 'guest:join', token: roomToken }));
    assert.match(String((await error).error), /already has a participant/);
    const bad = await openSocket(`ws://127.0.0.1:${port}/ws`, base);
    clients.push(bad);
    const invalid = expectEvent(bad, 'guest:error');
    bad.send(JSON.stringify({ type: 'guest:join', token: 'invalid-token' }));
    assert.match(String((await invalid).error), /invalid or expired/);
  } finally {
    for (const client of clients) client.terminate();
    child.kill('SIGTERM');
    rmSync(directory, { recursive: true, force: true });
  }
});
