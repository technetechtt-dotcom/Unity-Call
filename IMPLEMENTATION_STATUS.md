# Unity Call implementation status

Updated: 2026-11-07. Source-code changes committed directly to `main`. This document records *code implementation*, not production certification.

## Implemented and CI-checked in this development pass

- [x] Secure random OTP codes; generic eligible-user OTP request responses; per-IP/destination OTP throttling (single instance); Resend/Twilio delivery integration hooks (credentials still required).
- [x] HTTP-only, SameSite=Lax session cookies, Secure in production; client no longer stores bearer tokens in localStorage for new logins; sign-out, active session listing/revocation and all-devices sign-out.
- [x] Personal data JSON download and expanded account erasure including local media deletion attempts.
- [x] Require accepted contacts for new conversations, enforce media ownership on messages, and validate call participants and state transitions.
- [x] Replace custom WebSocket framing with `ws`, enforce upgrade Origin checks, reject invalid call actions, and revalidate sessions for incoming messages.
- [x] Harden HTTP response headers, mutation origin checks, request body bounds, basic request rate limiting, structured HTTP logs and stricter JSON parsing.
- [x] File MIME/header validation, attachment type checks, per-user storage quota and safer file download disposition.
- [x] Offline message queue isolated by user, replay deduplication, retry of optimistic failed messages and more truthful delivery acknowledgement.
- [x] Voice calls request microphone without requiring camera; early ICE candidates are queued; outgoing offer waits for accepting client media readiness.
- [x] Both participants must explicitly consent for server-side storage of call transcripts; browser caption-language selector and error feedback.
- [x] Clear labelling of manual SASL vocabulary and text-only sign display.
- [x] Interpreter booking request validation and status lifecycle APIs; requester UI for viewing/cancelling requests.
- [x] Organisation ownership/staff roles, self-service creation, desk administration, queue and appointment updates; admin and requester interfaces.
- [x] PWA manifest, vector icon, app metadata and existing service worker registration.
- [x] Scheduled cleanup of expired OTPs, sessions and guest links.
- [x] CI with frontend/backend type-checking, lint, isolated backend self-check, HTTP security integration tests and production build.
- [x] README corrected to avoid claiming PostgreSQL or guest media calling are operational.

## Additional development implemented on 2026-11-07

- [x] Delivery acknowledgements are now accepted only from the actual receiving participant; sender status manipulation is prevented.
- [x] Sender-authorised message deletion removes message content for all conversation participants, with realtime update events.
- [x] Optional cursor pagination for conversation messages with bounded page size and API validation.
- [x] Stronger call lifecycle transitions, unanswered-call expiry and realtime missed-call notifications.
- [x] Camera enable/disable and microphone/camera input selection, where browsers expose devices.
- [x] Authenticated call lookup for direct navigation or page refresh.
- [x] Guest browser WebRTC room with two scoped roles, invitation validity checks, signalling relay and typed responses; still requires real network/media validation.
- [x] Guest invitation listing and owner-only revocation; direct call room ownership validation and reduced public invitation details.
- [x] Additional HTTP and guest WebSocket integration tests; these verify signalling/authorization but not physical-device media.

## Further software engineering — no supplier account required, but NOT completed

- [ ] Refactor synchronous JSON datastore to a transactional PostgreSQL implementation; add versioned migrations, migration tests, recovery/restore tests and a safe cutover tool.
- [ ] Add refresh-token rotation or shorter session expiry/renewal, optional MFA, suspicious-login detection, persistent/distributed rate limits and role-change audit events.
- [ ] Validate and harden newly implemented browser guest calls across real devices, including reconnection, TURN and complete guest accessibility; integrate into ordinary call history.
- [ ] Add robust calling reconnection, speaker/Bluetooth selection, call quality recovery and full real-device integration tests; missed-call timeout and input selection are implemented.
- [ ] Add per-route schema validation, pagination, background job worker, service-level metrics and complete API tests.
- [ ] Complete media deletion/retention and accessible previews/progress/recovery; message deletion and basic receiver receipts have been implemented, but comprehensive delivery-state testing remains.
- [ ] Add interpreter credential review/admin tools, availability calendar, reminders, cancellation/booking confirmations and integrated interpretation calls.
- [ ] Add organisational reporting, staff invitations via accessible discovery, scheduling conflicts, availability slots and complete queue management.
- [ ] Build group messaging with participant administration and appropriate permissions; group and three-way calling require a separate WebRTC design.
- [ ] Implement more robust offline caching, app update notification and local background notification controls.
- [ ] Expand screen-reader keyboard focus management, caption corrections and full error/loading states throughout all routes.
- [ ] Add automated accessibility testing and realistic cross-account end-to-end browser suites.
- [ ] Add structured security audit history, moderation review screens, documented data-retention configuration, incident response workflows and operational POPIA procedures.

## External providers, specialist reviewers or real-world test environments required

- [ ] Production PostgreSQL instance and storage/backup service configuration; cloud infrastructure, TLS/domain and deployment secrets.
- [ ] Email/SMS provider accounts, verified sending identities and production OTP delivery testing.
- [ ] TURN server/credentials and real mobile-network/WebRTC tests; production push subscriptions and VAPID deployment.
- [ ] Real Android, iOS, desktop, NVDA, TalkBack and VoiceOver testing with accessibility participants.
- [ ] Deaf/SASL expert-led linguistic validation, consented labelled training data, recognition model evaluation and any signing-avatar content.
- [ ] Independent penetration testing, POPIA legal review and controlled institutional pilots.
- [ ] Quality validation of South African speech transcription across accents, languages, environmental noise and budget devices.

## Launch decision

**Not ready for real user data or a public production launch.** CI success verifies build and narrow automated tests only. In particular, storage remains a local JSON file; guest media calls need real-device validation, automatic SASL recognition, production push notification delivery, and full accessibility validation remain incomplete. Consult `PRODUCTION_GATES.md` before staging or a competition demonstration.
