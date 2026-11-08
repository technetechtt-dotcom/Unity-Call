# Requested 130-task programme

Status as of 8 November 2026. This is an implementation backlog, not production certification.
`Implemented` means the described local change is covered by the checks below.
`Partial` means the task still has requirements outstanding. `Open` means this change set does not complete it, even if pilot code already exists.

## Implemented changes and evidence

- **14 — Cookie-only authentication:** HTTP bearer headers and WebSocket payload tokens no longer authenticate. The current client already uses HTTP-only cookies. Guest integration checks reject a valid cookie token submitted as a bearer header and accept the cookie.
- **17 — Account export credentials:** export uses the existing explicit private-user projection; excludes password hashes, future unknown authentication fields, and booking join tokens. Regression seeds legacy password/MFA secrets and verifies absence.
- **32 — Public interpreter fields:** directory explicitly selects public fields. Only the administrator route requests review metadata. Profile updates reject unknown fields, including forged verification status, and validate language/bio/availability types.
- **34 — Message media cleanup:** deleting the last referencing message removes its local file and inventory record. Other messages and derivative-media references protect the file. Failed unlinks retain inventory for operational retry. This does not provide object-store lifecycle deletion or a durable cleanup queue.
- **60 — Booking token disclosure:** only authorized participants receive tokens, only while a booking is accepted; exports always omit tokens. Requested, cancelled, declined and completed bookings omit them.
- **61 — Organisation invitation:** `/join/:token` now resolves organisation invitations to a service directory and authenticated queue check-in. Six viewport widths and an axe scan pass for this page. Anonymous visitors must sign in and reopen the invitation. QR-code generation and anonymous check-in remain task 62.

## Partial changes

- **16, 18, 20, 31:** targeted interpreter validation, participant authorization and export privacy tests; no claim of exhaustive endpoint validation, every-role coverage, independent penetration testing or full legal export review.
- **24:** TURN REST credentials signed server-side with configurable 60–3600 second TTL, unique opaque identifiers, no-store responses, and production rejection of static credentials. Requires actual coturn provisioning, secret installation/rotation and live relay verification. Connections lasting beyond TTL need credential refresh during future ICE recovery work.
- **33:** deletion cleanup improved; configurable retention, durable retry and object storage still open. Filesystem unlink is not cryptographic erasure of backups or snapshots.
- **42:** earlier-message pagination preserves scroll offset before paint; incoming updates no longer force readers to the bottom while reading history. Chromium regression verifies the existing message position after prepending. Images changing height after load need further coverage.
- **43:** chat thread now has loading, empty/search-empty and retry states. Chat list consistency and offline error coverage remain.
- **62:** authenticated invitation check-in only; QR codes and anonymous onboarding remain.
- **85, 89, 99:** Playwright checks organisation invitations at 320, 375, 390, 430, 768 and 1280 pixels, runs axe on that page, and verifies chat scroll anchoring. This is not coverage of all screens or critical journeys.
- **103:** CI adds both lockfile audits and Trivy filesystem vulnerability/secret/misconfiguration scanning. Backend lockfile is now committed and installed with `npm ci`. Local npm audits report zero vulnerabilities after upgrading Vite, removing unused react-router-dom and updating transitive packages. CI scanner execution and container-image scanning remain unverified; no deployable container is supplied.

## Complete numbered ledger

| ID | Task | Status |
| --- | --- | --- |
| 1 | PostgreSQL persistence | Open |
| 2 | Versioned entity migrations | Open |
| 3 | Verified JSON import | Open |
| 4 | Transactions, concurrency and pooling | Open |
| 5 | Backups and restoration tests | Open |
| 6 | Persistent secure object storage | Open |
| 7 | Staging, deployment, rollback and DR | Open |
| 8 | Application/database/infrastructure monitoring | Open |
| 9 | Live Resend and Twilio tests | Open — provider credentials and authorized delivery destinations required |
| 10 | Distributed rate limiting | Open |
| 11 | Session renewal and expiry policies | Open |
| 12 | MFA and security notification delivery | Open |
| 13 | Risk-based suspicious-login detection | Open |
| 14 | Remove legacy bearer authentication | Implemented |
| 15 | Registration/recovery enumeration review | Open |
| 16 | Complete API validation and sanitization | Partial |
| 17 | Exclude credential/internal auth fields from exports | Implemented |
| 18 | Every-role and tenant permission testing | Partial |
| 19 | Immutable security audit records | Open |
| 20 | Penetration testing/remediation | Partial — targeted security fixes only |
| 21 | ICE restart/reconnection | Open |
| 22 | Signalling recovery and event replay | Open |
| 23 | Refresh recovery for active media | Open |
| 24 | Production TURN provisioning and rotation | Partial |
| 25 | Mobile networks and NAT tests | Open — real networks/devices required |
| 26 | Call failure/recovery states | Open |
| 27 | Disconnected device fallback | Open |
| 28 | Multi-device/browser call lifecycle tests | Open |
| 29 | Caption delivery, sequence and consent tests | Open |
| 30 | Guest-room reconnection and real media tests | Open |
| 31 | Full account export scope review | Partial |
| 32 | Public directory review/audit field exclusion | Implemented |
| 33 | Secure deletion and media retention | Partial |
| 34 | Reference-aware message media cleanup | Implemented |
| 35 | Malware scanning/storage policies | Open |
| 36 | POPIA retention/access/incident procedures | Open |
| 37 | Multi-device offline reconciliation | Open |
| 38 | Receipt synchronization on reconnect | Open |
| 39 | Upload progress/retry | Open |
| 40 | Image/document/video previews | Open |
| 41 | Voice-note recovery | Open |
| 42 | Preserve earlier-message reading position | Partial — tested text pagination; dynamic media needs coverage |
| 43 | Chat loading/empty/retry/error states | Partial |
| 44 | Multi-device deletion/blocking tests | Open |
| 45 | Audio-only video fallback | Open |
| 46 | Audio output selection | Open |
| 47 | Improved quality metrics | Open |
| 48 | Call history pagination/search | Open |
| 49 | Accessible call/transcript details | Open |
| 50 | Caption correction/language evaluation | Open |
| 51 | Accessible dialogs replacing native prompts | Open |
| 52 | Interpreter evidence submission/review | Open |
| 53 | Verification reasons, expiry and appeals | Open |
| 54 | Interpreter working hours/calendar | Open |
| 55 | Rescheduling and booking conflicts | Open |
| 56 | Booking notification delivery | Open |
| 57 | Actual interpreted session joining | Open |
| 58 | Attendance/completion records | Open |
| 59 | Feedback/disputes | Open |
| 60 | Participant/state-limited booking tokens | Implemented |
| 61 | Organisation invitation destination fix | Implemented |
| 62 | Guest onboarding and QR check-in | Partial |
| 63 | Staff invitation acceptance | Open |
| 64 | Membership role changes/revocation/audit | Open |
| 65 | Service hours/staff calendars | Open |
| 66 | Cross-staff/desk appointment conflicts | Open |
| 67 | Appointment confirmation/rescheduling | Open |
| 68 | Realtime queue updates/notifications | Open |
| 69 | Queue capacity/estimates/history | Open |
| 70 | Organisation performance dashboards | Open |
| 71 | Sector-specific configurable services | Open |
| 72 | Global administrator dashboard | Open |
| 73 | User suspension/reinstatement | Open |
| 74 | Role/permission management interface | Open |
| 75 | Moderation/abuse dashboard | Open |
| 76 | Security audit dashboard | Open |
| 77 | Notification delivery/preferences admin | Open |
| 78 | Consent/data request management | Open |
| 79 | Retention administration | Open |
| 80 | Metrics/errors/incidents dashboard | Open |
| 81 | Strong admin authentication/independent review | Open |
| 82 | Keyboard/focus testing | Open |
| 83 | NVDA/TalkBack/VoiceOver | Open — assistive technology validation required |
| 84 | All-screen 200%/400% zoom | Open |
| 85 | All-screen responsive validation | Partial |
| 86 | Mobile keyboard overlap | Open |
| 87 | Sign camera mobile/focus layout | Open |
| 88 | Reliable network/call/failure announcements | Open |
| 89 | Accessibility regression tests | Partial |
| 90 | Deaf/blind/low-vision usability study | Open — participant recruitment and research required |
| 91 | Push subscription lifecycle | Open |
| 92 | VAPID/production push | Open |
| 93 | Background call notifications | Open |
| 94 | Notification permission/category settings | Open |
| 95 | Android/iOS PWA validation | Open |
| 96 | Background message sync/recovery | Open |
| 97 | Service-worker cache/update rollback | Open |
| 98 | App-wide online/offline recovery | Open |
| 99 | All-critical-journey browser tests | Partial |
| 100 | Every-route/form/link/button automation | Open |
| 101 | Load/concurrency/performance tests | Open |
| 102 | Backend/duplicate/network failure tests | Open |
| 103 | CI dependency/container/secret scanning | Partial |
| 104 | Deployment verification | Open |
| 105 | Automated rollback/restore drills | Open |
| 106 | Production acceptance checklist completion | Open — existing gates remain unsatisfied |
| 107 | Group chat management | Open |
| 108 | Group invitations/permissions | Open |
| 109 | Group messaging/receipts | Open |
| 110 | Group voice | Open |
| 111 | Group video | Open |
| 112 | Three-way interpreted conferencing | Open |
| 113 | Group moderation | Open |
| 114 | SASL dataset governance/consent collection | Open |
| 115 | Annotation/quality tooling | Open |
| 116 | Landmark pipeline | Open |
| 117 | Genuine SASL model training/evaluation | Open — governed dataset and research required |
| 118 | Confidence/unknown-sign handling | Open |
| 119 | Verified sign video playback | Open |
| 120 | Linguistically validated signing avatar | Open — signing assets and linguistic validation required |
| 121 | Continuous recognition research | Open |
| 122 | Multilingual translation | Open |
| 123 | Consent-based AI summaries | Open |
| 124 | AI image description/review | Open |
| 125 | Accessible hands-free controls | Open |
| 126 | Plans/usage billing | Open — billing provider and commercial rules required |
| 127 | Interpreter compensation | Open |
| 128 | Organisation branding/features | Open |
| 129 | Commercial onboarding/subscriptions | Open |
| 130 | Usage/quality/financial analytics | Open |

## Next implementation dependency

Start with 1–4: convert the synchronous database boundary and all HTTP/WebSocket callers to an asynchronous repository, implement relational migrations with ownership/uniqueness constraints, and verify JSON import against a real PostgreSQL instance. A stored JSON blob in PostgreSQL or a schema file alone does not satisfy these tasks. Then implement durable media jobs, rate limits, audits and deployment recovery against that persistence layer. No production deployment or external-provider live test has been performed by this change set.
