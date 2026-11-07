import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const tempDirectory = mkdtempSync(path.join(tmpdir(), 'unity-test-'));
process.env.DATA_DIR = tempDirectory;
const { db } = await import('./db.ts');

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const stamp = Date.now();
const alice = db.createUser({ name: 'Alice', email: `alice-${stamp}@example.com` });
const bob = db.createUser({ name: 'Bob', email: `bob-${stamp}@example.com` });
const { token } = db.createSession(alice.id);
assert(db.getSessionUser(token)?.id === alice.id, 'session should resolve the owner');
assert(!db.getSessionUser('nope'), 'unknown tokens must not resolve');

let unauthorized = false;
try { db.getOrCreateConversation(alice.id, bob.id); } catch { unauthorized = true; }
assert(unauthorized, 'unaccepted contacts must not get a conversation');
const invitation = db.inviteContact(alice.id, bob.id);
db.acceptContact(bob.id, invitation.id);
const conversation = db.getOrCreateConversation(alice.id, bob.id);
const message = db.createMessage({
  conversationId: conversation.id,
  senderId: alice.id,
  type: 'text',
  body: 'Hello Bob'
});
assert(message.body === 'Hello Bob', 'message body should persist');

let isolated = false;
try {
  db.listMessages(conversation.id, 'stranger');
} catch {
  isolated = true;
}
assert(isolated, 'strangers must not read private conversations');

db.blockUser(alice.id, bob.id);
assert(db.isBlocked(alice.id, bob.id), 'block should isolate both sides');
rmSync(tempDirectory, { recursive: true, force: true });
console.log('Unity self-check passed: isolated sessions, accepted contacts, messaging permissions and blocking.');
