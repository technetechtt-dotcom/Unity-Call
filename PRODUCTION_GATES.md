# Production readiness — open release gates (2026-11-07)

> **NOT PRODUCTION READY.** Security and calling fixes have been applied incrementally to `main`; none of the following is certified by the source-level changes alone.

## P0 gates remaining

- [ ] Replace `server/src/db.ts` JSON datastore with transaction-safe PostgreSQL using migrations, verified recovery and data migration.
- [ ] Replace `server/src/ws.ts` hand-built WebSocket decoder with a maintained WebSocket implementation, enforce Origin and connection/rate limits, and add protocol tests.
- [ ] Implement production-safe session storage, rotation, account/device session management and audited role enforcement.
- [ ] Complete guest room joining and access control; `GuestJoinPage` currently only displays invitation status.
- [ ] Validate two-person WebRTC call setup/teardown on actual devices and across NAT/mobile carriers; fix missed or out-of-order offers.
- [ ] Confirm caption and typed-speech delivery between two devices with real speech recognition, including unsupported-browser handling.
- [ ] Implement secured production media storage, server-side content inspection, quotas and irreversible file deletion.
- [ ] Configure production Resend/Twilio credentials and verify delivery. In-process OTP throttling must be replaced by shared backing storage for multi-instance deployment.
- [ ] Pass all CI checks, including lint; add API integration and end-to-end accessibility tests.
- [ ] Implement end-to-end consent and retention controls, POPIA assessment and an independent security review.

## P1 features and operational dependencies

- [ ] Verify interpreter credentials, availability, booking lifecycle, notifications and session access.
- [ ] Replace seeded organisation data with real tenant onboarding, RBAC, scheduling and staff workflows.
- [ ] Finish accessible appointment time-slot selection, QR guest sessions and confirmation UI.
- [ ] Deploy Web Push subscriptions, VAPID, background call notifications, TURN with expiring credentials, and monitoring.
- [ ] Test on budget Android devices, desktop, screen readers, 200%/400% zoom, offline and degraded networks.
- [ ] Validate caption accuracy across South African accents and supported languages using consented test data.
- [ ] Recruit paid Deaf/SASL advisers, validate labels, collect consented samples, and evaluate any recognition model before claiming sign translation.
- [ ] Complete incident response, privacy/terms, data access/erasure workflows, back-ups, rollback, security scanning and load testing.

## Environment configuration

Set `NODE_ENV=production` and supply `RESEND_API_KEY` + `OTP_FROM_EMAIL` for email OTP; `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` for SMS OTP. Configure `TURN_URLS`, `TURN_USERNAME`, `TURN_PASSWORD` only with appropriately scoped infrastructure. Do not commit secrets. A `DATABASE_URL` setting alone **does not** migrate the app to PostgreSQL.

## Known CI state at initial rollout

TypeScript checking, isolated backend self-check and production frontend build succeeded on an intermediate commit; lint failed. Check the current `main` workflow run before claiming a green release.

## Competition claims

The current sign panel is a manual vocabulary selector; the sign avatar is text-only. Automatic camera-based SASL recognition, continuous sign translation, paid interpreter sessions and reliable guest calling must not be represented as already operational.
