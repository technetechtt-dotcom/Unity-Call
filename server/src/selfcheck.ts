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

const third = db.createUser({ name: 'Third', email: `third-${stamp}@example.com` });
const devices = db.listSessions(alice.id, token);
assert(devices.length === 1 && devices[0].current, 'current session must be listed');
let rejected = false;
try { db.revokeSessionById(third.id, devices[0].id); } catch { rejected = true; }
assert(rejected, 'session ownership is required');

const call = db.createCall({ initiatorId: alice.id, calleeId: bob.id, type: 'voice', saveTranscript: false });
rejected = false;
try { db.updateCall(call.id, alice.id, 'accepted'); } catch { rejected = true; }
assert(rejected, 'caller cannot accept their own call');
db.updateCall(call.id, bob.id, 'accepted');
db.updateCall(call.id, alice.id, 'ended');
rejected = false;
try { db.updateCall(call.id, bob.id, 'accepted'); } catch { rejected = true; }
assert(rejected, 'ended calls cannot be reaccepted');

const org = db.createOrganization(alice.id, 'Unity Test Organisation', 'business');
rejected = false;
try { db.createDesk(bob.id, org.id, 'Billing'); } catch { rejected = true; }
assert(rejected, 'tenant management is restricted to admins');
const desk = db.createDesk(alice.id, org.id, 'Billing');
const item = db.joinQueue(bob.id, desk.id);
assert(item.id === db.joinQueue(bob.id, desk.id).id, 'queue entry should be idempotent');
rejected = false;
try { db.updateQueueItem(bob.id, desk.id, item.id, 'active'); } catch { rejected = true; }
assert(rejected, 'visitors cannot manage queues');
db.updateQueueItem(alice.id, desk.id, item.id, 'active');
const appointment = db.createAppointment(bob.id, org.id, new Date(Date.now() + 86400000).toISOString());
assert(db.listAppointments(bob.id).some(a => a.id === appointment.id), 'appointment belongs to requester');
db.cancelAppointment(bob.id, appointment.id);
const download = db.exportAccount(bob.id);
assert(download.user.id === bob.id, 'data export must be scoped to user');
rejected = false;
try { db.createMessage({ conversationId: conversation.id, senderId: third.id, type: 'text', body: 'Invalid' }); } catch { rejected = true; }
assert(rejected, 'non-members cannot send messages');

db.blockUser(alice.id, bob.id);
assert(db.isBlocked(alice.id, bob.id), 'block should isolate both sides');
db.revokeSessionById(alice.id, devices[0].id);
assert(!db.getSessionUser(token), 'revoked sessions must not authenticate');
db.deleteAccount(bob.id);
assert(!db.getUser(bob.id), 'deleted accounts must not resolve');
assert(!db.listAppointments(bob.id).length, 'deleted account appointments must be erased');
rmSync(tempDirectory, { recursive: true, force: true });
console.log('Unity self-check passed: sessions, contact permissions, calls, tenant RBAC, queues, appointments, exports, blocking and account erasure.');
