const KEY = 'unity_outbox';

// Do not allow queued private messages from one signed-in account to be sent by another.

export interface QueuedMessage {
  userId: string;
  clientId: string;
  conversationId: string;
  type: string;
  body?: string;
  createdAt: string;
}

function read(): QueuedMessage[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function write(items: QueuedMessage[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function enqueueMessage(item: QueuedMessage) {
  write([...read().filter(row => row.clientId !== item.clientId), item]);
}

export function peekQueue(userId: string) {
  return read().filter(row => row.userId === userId);
}

export function removeQueued(clientId: string) {
  write(read().filter((item) => item.clientId !== clientId));
}
