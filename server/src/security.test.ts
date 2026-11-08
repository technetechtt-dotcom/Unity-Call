import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHmac } from 'node:crypto';
import { iceConfiguration } from './ice.ts';

const directory = mkdtempSync(path.join(tmpdir(), 'unity-security-'));
process.env.DATA_DIR = directory;
const { Database } = await import('./db.ts');

test('privacy projections and interpreter privilege boundaries', () => {
  try {
    const database = new Database();
    const owner = database.createUser({ name: 'Owner', email: 'owner@example.com' });
    const interpreter = database.createUser({ name: 'Interpreter', email: 'interpreter@example.com' });
    const stranger = database.createUser({ name: 'Stranger' });
    process.env.PLATFORM_ADMIN_EMAILS = owner.email;
    const profile = database.upsertInterpreter(interpreter.id, { available: true, languages: ['SASL'] });
    assert.throws(() => database.upsertInterpreter(interpreter.id, JSON.parse('{"qualified":true,"reviewedBy":"fake"}')), /Invalid interpreter/);
    assert.throws(() => database.upsertInterpreter(interpreter.id, { languages: [42] } as never), /Invalid interpreter/);
    assert.throws(() => database.reviewInterpreter(stranger.id, profile.id, 'approved'), /Administrator/);
    database.reviewInterpreter(owner.id, profile.id, 'approved');
    const publicProfile = database.listInterpreters()[0];
    assert.equal(publicProfile.qualified, true);
    for (const key of ['reviewedAt', 'reviewedBy', 'reviewStatus']) assert.equal(key in publicProfile, false);
    assert.equal(database.listInterpreters(true)[0].reviewedBy, owner.id);
    const booking = database.bookInterpreter(owner.id, profile.id, new Date(Date.now() + 86400000).toISOString());
    assert.equal('joinToken' in booking, false);
    assert.deepEqual(database.listBookings(stranger.id), []);
    assert.throws(() => database.updateBooking(stranger.id, booking.id, 'accepted'), /Booking not found/);
    const accepted = database.updateBooking(interpreter.id, booking.id, 'accepted');
    assert.ok(accepted.joinToken);
    assert.equal(database.listBookings(owner.id)[0].joinToken, accepted.joinToken);
    assert.equal('joinToken' in database.exportAccount(owner.id).bookings[0], false);
    database.updateBooking(owner.id, booking.id, 'cancelled');
    assert.equal('joinToken' in database.listBookings(interpreter.id)[0], false);
    const contact = database.inviteContact(owner.id, interpreter.id);
    database.acceptContact(interpreter.id, contact.id);
    const conversation = database.getOrCreateConversation(owner.id, interpreter.id);
    const mediaPath = path.join(directory, 'uploads', 'shared.txt');
    writeFileSync(mediaPath, 'shared media');
    const media = database.createMedia({ ownerId: owner.id, kind: 'document', path: mediaPath, mime: 'text/plain', size: 12 });
    const first = database.createMessage({ conversationId: conversation.id, senderId: owner.id, type: 'document', mediaId: media.id });
    const second = database.createMessage({ conversationId: conversation.id, senderId: owner.id, type: 'document', mediaId: media.id });
    assert.throws(() => database.deleteMessage(first.id, stranger.id));
    database.deleteMessage(first.id, owner.id);
    assert.equal(existsSync(mediaPath), true, 'another valid message still references the file');
    database.deleteMessage(second.id, owner.id);
    assert.equal(existsSync(mediaPath), false, 'last message deletion removes the file');
    assert.equal(database.exportAccount(owner.id).media.some(item => item.id === media.id), false);
    const originalPath = path.join(directory, 'uploads', 'original.txt');
    writeFileSync(originalPath, 'original');
    const original = database.createMedia({ ownerId: owner.id, kind: 'document', path: originalPath, mime: 'text/plain', size: 8 });
    database.createMedia({ ownerId: owner.id, kind: 'document', path: path.join(directory, 'uploads', 'derivative.txt'), mime: 'text/plain', size: 8, originalId: original.id });
    const originalMessage = database.createMessage({ conversationId: conversation.id, senderId: owner.id, type: 'document', mediaId: original.id });
    database.deleteMessage(originalMessage.id, owner.id);
    assert.equal(existsSync(originalPath), true, 'derivative media still references the original');
    // Simulate a legacy persisted password hash and unknown future authentication fields.
    const file = path.join(directory, 'unity.json');
    const store = JSON.parse(readFileSync(file, 'utf8'));
    Object.assign(store.users[0], { passwordHash: 'PRIVATE_HASH', mfaSecret: 'PRIVATE_MFA' });
    writeFileSync(file, JSON.stringify(store));
    const restored = new Database();
    const exported = JSON.stringify(restored.exportAccount(owner.id));
    assert.equal(exported.includes('PRIVATE_'), false);
    assert.equal(restored.exportAccount(owner.id).user.email, owner.email);
  } finally {
    delete process.env.PLATFORM_ADMIN_EMAILS;
    rmSync(directory, { recursive: true, force: true });
  }
});

test('TURN credentials are temporary, uniquely scoped and signed without disclosing the secret', () => {
  const env = { NODE_ENV: 'production', TURN_URLS: 'turn:relay.example.com:3478,turns:relay.example.com:5349', TURN_SHARED_SECRET: 'test-signing-secret', TURN_CREDENTIAL_TTL_SECONDS: '600' };
  const config = iceConfiguration(env, 1000000);
  const relay = config.iceServers[2];
  assert.equal(config.turnConfigured, true);
  assert.ok(relay.username);
  assert.match(relay.username, /^1600:[a-f0-9]{24}$/);
  assert.equal(relay.credential, createHmac('sha1', env.TURN_SHARED_SECRET).update(relay.username).digest('base64'));
  assert.notEqual(iceConfiguration(env, 1000000).iceServers[2].username, relay.username);
  assert.equal(JSON.stringify(config).includes(env.TURN_SHARED_SECRET), false);
  assert.throws(() => iceConfiguration({ ...env, TURN_SHARED_SECRET: '' }), /Production TURN/);
  assert.throws(() => iceConfiguration({ ...env, TURN_CREDENTIAL_TTL_SECONDS: '86400' }), /lifetime/);
  assert.throws(() => iceConfiguration({ ...env, TURN_URLS: 'https://relay.example.com' }), /Invalid TURN/);
});
