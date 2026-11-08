# Unity-Call — outstanding production release gates
Updated 2026-11-08. See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for the committed engineering work.

> **Do not deploy for sensitive or unattended public use yet.** Passing GitHub CI does not certify calling on real networks, accessibility, compliance or infrastructure.

## 2026-11-08 implementation additions

Contact invitations now have a visible accept/decline inbox, accepted-contact chat navigation, generic email/phone lookup responses, and two-account HTTP tests. Session-token rotation exists with an explicit user-controlled renewal action and basic new-browser event history, but still lacks production-grade distributed security controls. The interpreter platform now has an allowlisted reviewer dashboard with approve/reject/suspend and interpreter-facing booking controls, but validation of real credentials and live interpreted sessions is outstanding. Incoming calls restore metadata following a refresh; message pagination and offline static shell were improved. Profile/report/callback failure states, missing-route handling and user-controlled app updates were added.

These features were committed but their final GitHub CI run, external-device testing and production acceptance must be verified separately.

## P0: blockers

- [ ] Replace synchronous JSON storage with transaction-safe PostgreSQL, migrate legacy data, and test migration/rollback/restore.
- [ ] Finish production authentication hardening: persistent/distributed throttling, session rotation/expiry review, additional account-abuse controls and fully tested OTP delivery.
- [ ] Configure production TURN infrastructure and verify two-way voice/video across different networks and browsers.
- [ ] Validate the new two-person guest WebRTC room on real devices; the server-level admission and signalling tests pass, but media NAT/permission reliability is unverified.
- [ ] Add full browser-to-browser end-to-end tests covering calls, captions, session recovery, guest invites and message flows.
- [ ] Replace local uploaded-media filesystem storage with private production object storage; complete malware inspection, deletion and restore procedures.
- [ ] Run deployment security review, penetration test, accessibility evaluation and a privacy/POPIA review before external launch.
- [ ] Deploy staging and production with TLS, managed secrets, monitoring, backups, rollback and incident procedures.

## P1: commercial readiness and UX

- [ ] Finish interpreter verification administration, availability calendar, booking confirmations, session management and notification delivery.
- [ ] Complete organisation staff invitations, scheduling/conflict checks, appointment confirmations and analytics.
- [ ] Improve call reconnection and ICE restart, audio output/Bluetooth switching, notifications and quality recovery.
- [ ] Add complete offline and media error recovery, per-message retention/media deletion, accessible previews and consistent delivery-state integration tests.
- [ ] Implement push subscription management, production VAPID, service-worker updates and comprehensive PWA tests.
- [ ] Build full keyboard/zoom/screen-reader usability coverage and automated accessibility regression tests.
- [ ] Add durable audit history, moderation workflows, configurable data retention, metrics and background jobs.

## P2: advanced product capabilities

- [ ] Group messaging with participant moderation, group voice/video and optional interpreter-assisted three-way calls.
- [ ] Multilingual speech/message translation and consent-based summaries.
- [ ] Consent-based image descriptions and expanded voice navigation.
- [ ] Validated SASL video playback, language resources, and eventually camera-based recognition/continuous signing research.
- [ ] Organisation service-channel specialisations, analytics and configurable branding.

## Changes already implemented in code

- Maintained `ws` library, same-origin controls and authorised call signalling.
- HTTP-only session cookies, session/device controls and account exports.
- Secure OTP generation and email/SMS integration code (provider setup still required).
- Accepted-contact permissions, account-scoped offline queue and message deletion.
- Receiver-authorised delivery receipts, read status handling and cursor pagination.
- Unanswered-call timeout, limited media-device switching and direct-call metadata retrieval.
- Two-person invitation-scoped guest room with WebRTC offer/answer relay, typed responses and link revocation.
- Basic file-signature validation, storage quotas, bounded requests, expiry cleanup and tests.
- Organisation and interpreter workflow foundations; PWA manifest and accessibility controls.

## Competition claims

The current sign-language panel is manual limited vocabulary, not validated automatic camera-based SASL recognition. A text-only sign representation is not a real signing avatar. Guest room signalling is automatically tested, but real-world call quality and accessibility are not yet verified. Do not claim production certification or operational SASL AI without evidence.
