import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp, createHttpServer, json } from './http.ts';

test('HTTP security headers, JSON validation and same-origin requests', async () => {
  const app = createApp();
  app.post('/api/echo', (req, res) => json(res, 200, { value: req.body.value }));
  const server = createHttpServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const accepted = await fetch(base + '/api/echo', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ value: 123 }) });
    assert.equal(accepted.status, 200);
    assert.equal((await accepted.json()).value, 123);
    assert.equal(accepted.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(accepted.headers.get('x-frame-options'), 'DENY');
    const attack = await fetch(base + '/api/echo', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://example.invalid' }, body: '{}' });
    assert.equal(attack.status, 403);
    const invalid = await fetch(base + '/api/echo', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: '[1,2,3]' });
    assert.equal(invalid.status, 400);
    const absent = await fetch(base + '/api/absent');
    assert.equal(absent.status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
