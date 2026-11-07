
type Handler = (payload: Record<string, unknown>) => void;

class RealtimeClient {
  private socket?: WebSocket;
  private handlers = new Set<Handler>();
  private retries = 0;
  private opened = false;
  private enabled = false;

  connect() {
    this.enabled = true;
    if (this.opened) return;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
    this.opened = true;
    this.socket.onopen = () => {
      this.retries = 0;
      this.socket?.send(JSON.stringify({ type: 'auth' }));
    };
    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'error' && payload.error === 'Invalid session.') { this.disconnect(); return; }
        this.handlers.forEach((handler) => handler(payload));
      } catch { /* Ignore malformed server events. */ }
    };
    this.socket.onclose = () => {
      this.opened = false;
      this.socket = undefined;
      if (!this.enabled) return;
      const delay = Math.min(8000, 500 * 2 ** this.retries);
      this.retries += 1;
      window.setTimeout(() => this.connect(), delay);
    };
  }

  disconnect() {
    this.enabled = false;
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
