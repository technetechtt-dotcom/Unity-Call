const KEY = 'unity_outbox';

export interface QueuedMessage {
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
  write([...read(), item]);
}

export function peekQueue() {
  return read();
}

export function removeQueued(clientId: string) {
  write(read().filter((item) => item.clientId !== clientId));
}
