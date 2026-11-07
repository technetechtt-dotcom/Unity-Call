import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { parse } from 'node:url';

export type Req = IncomingMessage & {
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, unknown>;
  userId?: string;
};

type Handler = (req: Req, res: ServerResponse) => void | Promise<void>;

interface Route {
  method: string;
  parts: string[];
  handler: Handler;
}

export function createApp() {
  const routes: Route[] = [];

  function add(method: string, path: string, handler: Handler) {
    routes.push({ method, parts: path.split('/').filter(Boolean), handler });
  }

  return {
    get: (path: string, handler: Handler) => add('GET', path, handler),
    post: (path: string, handler: Handler) => add('POST', path, handler),
    patch: (path: string, handler: Handler) => add('PATCH', path, handler),
    delete: (path: string, handler: Handler) => add('DELETE', path, handler),
    match(req: IncomingMessage) {
      const url = parse(req.url || '/', true);
      const parts = (url.pathname || '/').split('/').filter(Boolean);
      for (const route of routes) {
        if (route.method !== req.method || route.parts.length !== parts.length) continue;
        const params: Record<string, string> = {};
        let ok = true;
        for (let i = 0; i < route.parts.length; i += 1) {
          if (route.parts[i].startsWith(':')) params[route.parts[i].slice(1)] = decodeURIComponent(parts[i]);
          else if (route.parts[i] !== parts[i]) ok = false;
        }
        if (!ok) continue;
        const query: Record<string, string> = {};
        for (const [key, value] of Object.entries(url.query)) {
          if (typeof value === 'string') query[key] = value;
        }
        return { handler: route.handler, params, query };
      }
      return null;
    }
  };
}

export function json(res: ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

export async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let bytes = 0;
  const limit = 14 * 1024 * 1024;
  for await (const chunk of req) {
    bytes += (chunk as Buffer).length;
    if (bytes > limit) throw Object.assign(new Error('Request body too large.'), { status: 413 });
    chunks.push(chunk as Buffer);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export function createHttpServer(app: ReturnType<typeof createApp>, onUpgrade?: (req: IncomingMessage, socket: import('node:stream').Duplex) => void) {
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'geolocation=(), payment=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'");
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    const matched = app.match(req);
    if (!matched) {
      json(res, 404, { error: 'Not found.' });
      return;
    }
    try {
      const body = req.method === 'GET' ? {} : await readBody(req);
      const wrapped = Object.assign(req, {
        params: matched.params,
        query: matched.query,
        body
      }) as Req;
      await matched.handler(wrapped, res);
    } catch (error) {
      const status = error && typeof error === 'object' && 'status' in error ? Number((error as { status: number }).status) : 400;
      json(res, status || 400, { error: error instanceof Error ? error.message : 'Request failed.' });
    }
  });
  if (onUpgrade) server.on('upgrade', onUpgrade);
  return server;
}
