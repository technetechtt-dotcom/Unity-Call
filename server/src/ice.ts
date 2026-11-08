import { createHmac, randomBytes } from 'node:crypto';

// coturn TURN REST API credentials. The shared signing secret never leaves the server.
export function iceConfiguration(env: NodeJS.ProcessEnv = process.env, time = Date.now()) {
  const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];
  const urls = (env.TURN_URLS || '').split(',').map(url => url.trim()).filter(Boolean);
  if (urls.some(url => !/^turns?:[^\s]+$/.test(url))) throw new Error('Invalid TURN URL configuration.');
  if (urls.length) {
    if (env.TURN_SHARED_SECRET) {
      const ttl = Number(env.TURN_CREDENTIAL_TTL_SECONDS || 600);
      if (!Number.isInteger(ttl) || ttl < 60 || ttl > 3600) throw new Error('TURN credential lifetime must be 60–3600 seconds.');
      const username = `${Math.floor(time / 1000) + ttl}:${randomBytes(12).toString('hex')}`;
      const credential = createHmac('sha1', env.TURN_SHARED_SECRET).update(username).digest('base64');
      iceServers.push({ urls, username, credential });
    } else {
      if (env.NODE_ENV === 'production') throw new Error('Production TURN requires TURN_SHARED_SECRET.');
      if (!env.TURN_USERNAME || !env.TURN_PASSWORD) throw new Error('TURN credentials are missing.');
      iceServers.push({ urls, username: env.TURN_USERNAME, credential: env.TURN_PASSWORD });
    }
  }
  return { iceServers, turnConfigured: urls.length > 0 };
}
