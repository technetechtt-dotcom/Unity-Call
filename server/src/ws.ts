import { createHash } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export class MiniSocket {
  userId?: string;
  readyState = 1;
  OPEN = 1;
  private listeners = new Map<string, Array<(data?: Buffer) => void>>();
  private socket: Duplex;

  constructor(socket: Duplex) {
    this.socket = socket;
    this.socket.on('data', (chunk) => this.decode(chunk));
    this.socket.on('close', () => this.emit('close'));
    this.socket.on('error', () => this.emit('close'));
  }

  on(event: string, handler: (data?: Buffer) => void) {
    const list = this.listeners.get(event) || [];
    list.push(handler);
    this.listeners.set(event, list);
  }

  private emit(event: string, data?: Buffer) {
    for (const handler of this.listeners.get(event) || []) handler(data);
  }

  send(data: string) {
    if (this.readyState !== this.OPEN) return;
    const payload = Buffer.from(data);
    const header = payload.length < 126
      ? Buffer.from([0x81, payload.length])
      : Buffer.concat([Buffer.from([0x81, 126]), Buffer.from([(payload.length >> 8) & 255, payload.length & 255])]);
    this.socket.write(Buffer.concat([header, payload]));
  }

  private decode(buffer: Buffer) {
    if (buffer.length < 2) return;
    const opcode = buffer[0] & 15;
    if (opcode === 8) {
      this.readyState = 3;
      this.socket.end();
      this.emit('close');
      return;
    }
    const masked = Boolean(buffer[1] & 128);
    let length = buffer[1] & 127;
    let offset = 2;
    if (length === 126) {
      length = buffer.readUInt16BE(2);
      offset = 4;
    }
    let payload = buffer.subarray(offset);
    if (masked) {
      const mask = payload.subarray(0, 4);
      payload = payload.subarray(4, 4 + length);
      const decoded = Buffer.alloc(payload.length);
      for (let i = 0; i < payload.length; i += 1) decoded[i] = payload[i] ^ mask[i % 4];
      payload = decoded;
    }
    this.emit('message', payload);
  }
}

export function upgradeWebSocket(req: IncomingMessage, socket: Duplex) {
  const key = req.headers['sec-websocket-key'];
  if (!key || Array.isArray(key)) {
    socket.destroy();
    return null;
  }
  const accept = createHash('sha1').update(key + GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  return new MiniSocket(socket);
}
