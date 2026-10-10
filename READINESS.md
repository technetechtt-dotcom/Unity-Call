# Launch readiness

This file separates product work that is in the codebase from operational work that still needs people, devices, and budget.

## Implemented in software

- Account isolation, sessions, OTP, recovery, logout, and deletion
- Contacts, invitations, messaging states, offline queue, stored voice notes
- Inclusive call states, mute, captions, typed-to-speech, speaker labels, optional transcripts
- Accessibility settings, labels, focus, enlarged text, haptic/visual/spoken alerts
- Limited SASL vocabulary with camera framing and no fabricated detections
- Interpreter profiles/bookings and organisation desks, queues, appointments, guest QR links
- Help, privacy, and terms pages
- Automated isolation self-check: `npm test`

## Requires real-world operations

- Paid Deaf/SASL advisers and independently qualified interpreters
- Linguistic validation of any future avatar content beyond the listed vocabulary
- Consented training-data collection and independent recognition evaluation
- Caption tests for English, Afrikaans, isiZulu, isiXhosa, mixed speech, names, accents, and noise
- Device tests on affordable Android phones, battery, and interrupted networks
- Web Push VAPID keys and a TURN provider for production calling
- A controlled pilot with a municipality, campus, or business
- Cost measurement before subscription prices
- Task-completion studies with blind and Deaf participants
