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
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
  });
  res.end(body);
}

export async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export function createHttpServer(app: ReturnType<typeof createApp>, onUpgrade?: (req: IncomingMessage, socket: import('node:stream').Duplex) => void) {
  const server = createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
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
