import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocket, WebSocketServer } from 'ws';

// Delegate protocol framing, fragmentation, control frames and payload validation
// to a maintained WebSocket implementation rather than parsing frames manually.
const server = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024, perMessageDeflate: false });

export class MiniSocket {
  userId?: string;
  readonly OPEN = WebSocket.OPEN;
  constructor(private readonly socket: WebSocket) {}
  get readyState() { return this.socket.readyState; }
  send(data: string) { if (this.readyState === this.OPEN) this.socket.send(data); }
  close() { this.socket.close(); }
  on(event: 'message' | 'close', handler: (data?: Buffer) => void) {
    if (event === 'message') this.socket.on('message', (data, isBinary) => {
      if (isBinary) { this.socket.close(1003, 'Text messages only'); return; }
      handler(Buffer.isBuffer(data) ? data : Buffer.from(String(data)));
    });
    else this.socket.on('close', () => handler());
  }
}

export function upgradeWebSocket(req: IncomingMessage, socket: Duplex): MiniSocket | null {
  const origin = req.headers.origin;
  const allowedOrigin = process.env.APP_ORIGIN;
  // Browsers send Origin, so fail closed for unapproved cross-origin requests.
  let originAllowed = false;
  try { originAllowed = !!origin && (allowedOrigin ? origin === allowedOrigin : new URL(origin).host === req.headers.host); } catch { originAllowed = false; }
  if (!originAllowed) {
    socket.destroy();
    return null;
  }
  if (req.headers.upgrade?.toLowerCase() !== 'websocket') {
    socket.destroy();
    return null;
  }
  let connection: MiniSocket | null = null;
  server.handleUpgrade(req, socket as import('node:net').Socket, Buffer.alloc(0), (ws) => {
    connection = new MiniSocket(ws);
  });
  return connection;
}
