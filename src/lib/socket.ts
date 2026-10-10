import { getToken } from './api';

type Handler = (payload: Record<string, unknown>) => void;

class RealtimeClient {
  private socket?: WebSocket;
  private handlers = new Set<Handler>();
  private retries = 0;
  private opened = false;

  connect() {
    const token = getToken();
    if (!token || this.opened) return;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
    this.opened = true;
    this.socket.onopen = () => {
      this.retries = 0;
      this.socket?.send(JSON.stringify({ type: 'auth', token }));
    };
    this.socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      this.handlers.forEach((handler) => handler(payload));
    };
    this.socket.onclose = () => {
      this.opened = false;
      this.socket = undefined;
      if (!getToken()) return;
      const delay = Math.min(8000, 500 * 2 ** this.retries);
      this.retries += 1;
      window.setTimeout(() => this.connect(), delay);
    };
  }

  disconnect() {
    this.opened = false;
    this.socket?.close();
    this.socket = undefined;
  }

  send(payload: Record<string, unknown>) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  subscribe(handler: Handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

export const realtime = new RealtimeClient();
