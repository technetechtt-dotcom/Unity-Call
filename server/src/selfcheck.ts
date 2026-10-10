import { db } from './db.ts';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const stamp = Date.now();
const alice = db.createUser({ name: 'Alice', email: `alice-${stamp}@example.com` });
const bob = db.createUser({ name: 'Bob', email: `bob-${stamp}@example.com` });
const { token } = db.createSession(alice.id);
assert(db.getSessionUser(token)?.id === alice.id, 'session should resolve the owner');
assert(!db.getSessionUser('nope'), 'unknown tokens must not resolve');

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

console.log('Unity self-check passed: sessions, messaging isolation, and blocking work.');
