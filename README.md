# Unity Call

Inclusive messaging, voice/video calling, accessible captions and early-stage sign-first communication.

> **Pilot software — not production certified.** The project contains implemented features and operational gaps. Review [PRODUCTION_GATES.md](PRODUCTION_GATES.md) and [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) before deployment.

## Local development

Node.js 22+ is required.

1. `npm ci`
2. `npm install --prefix server`
3. `npm run dev`
4. Visit `http://localhost:5173`

In development, OTP codes are displayed on-screen. Create two accounts using separate browsers or profiles; contacts must accept invitations before new conversations and calls can be created.

## Quality checks

```sh
npx tsc --noEmit
npx tsc --noEmit --project server/tsconfig.json
npm run lint
npm test
node --experimental-strip-types --test server/src/http.test.ts
npm run build
```

GitHub Actions runs these checks on changes to `main` and pull requests.

## Features implemented in code

- OTP login and recovery, rate limits, optional Resend/Twilio delivery configuration, HTTP-only SameSite cookies, session listing/revocation and user-data export
- Accepted contacts, direct messages, offline queue, voice notes, file uploads and message-state tracking
- WebRTC voice/video with participant-authorised signalling, basic reconnection, caption relay and typed-to-speech responses
- Two-party opt-in for saved call transcripts
- Manual limited SASL phrase selection (not automatic sign recognition)
- Organisation registration, owner/staff permissions, service desks, appointments, queues and staff management
- Interpreter profile submission and booking-state endpoints; only verified interpreters may be booked
- PWA manifest, service worker and accessibility preferences

## Production configuration

Copy `.env.example` and configure appropriate secrets on your host. `NODE_ENV=production` enables secure-cookie requirements. For production email OTP set `RESEND_API_KEY` and `OTP_FROM_EMAIL`; for SMS set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`. Set `APP_ORIGIN` to the browser-facing HTTPS origin. Use `TURN_URLS`, `TURN_USERNAME` and `TURN_PASSWORD` for network traversal.

**Important:** Current persistence still uses a local JSON file. The PostgreSQL `schema.sql` is only a schema design; setting `DATABASE_URL` does **not** activate PostgreSQL or transactional database storage. Do not deploy for sensitive real-world use before completing persistence migration, media-object storage, penetration testing and accessibility validation.

## Limitations

Browser guest invitations currently provide a link-status page, not functioning guest media calls. Automated camera-to-SASL recognition, real animated SASL avatars, production push delivery and regulated interpreter verification are not yet operational. Live captions rely on browser speech recognition and vary by device, language and environment.
