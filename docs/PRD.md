# Wellspring Care Platform - Product Requirements (v1.0, 2026-10-19)

Condensed from the original brainstorm brief. Changes from the brief: MongoDB Atlas replaces Supabase (authorization moves to a repository layer, files to GridFS, rate limits to a TTL collection); 14 service divisions collapse into one data-driven intake engine; weddings, funerals and events share one booking pipeline; minors excluded at launch.
Claude Code: read only the section your task cites.

## 1. Scope and boundaries

### 1.1 Product
Web platform for a Christian holistic chaplaincy organization: public site, client portal, participant portal (renewal program), staff dashboards, intake, scheduling, payments, bookings.

### 1.2 Brand (configurable, never hardcoded)
Working name "Wellspring Holistic Chaplaincy & Family Care", tagline "Walking With You Through Every Season of Life." Stored in `organization_settings`: name, tagline, logo file id, contact email/phone/address, business hours, timezone (default America/New_York), currency (default USD), legal entity name. Name must be trademark-checked before launch (launch checklist item).

### 1.3 Professional boundaries (apply everywhere)
- Pastoral and spiritual care only. Never labeled therapy, psychotherapy or clinical counseling unless delivered by a licensed provider flagged as such on their provider profile.
- Site and forms state: not an emergency service, submissions are not monitored continuously. Emergency notice links to 911 and 988 on every intake form and on Contact.
- No promised outcomes ("healing", "cure", "guaranteed"). Copy review checklist in §15.3.
- Never pressure forgiveness, reconciliation with unsafe people, return to a harmful church, or public disclosure.
- Referral path to licensed providers exists on every care intake (§5.5).
- Adults only at launch. Intake asks "Are you 18 or older?"; "no" blocks submission and shows guardian contact info. A minors program requires a separate PRD.
- Hospice/healthcare: the organization complements, not replaces, clinical teams. No PHI collection. Any healthcare-partner workflow needs a HIPAA applicability review first; never claim HIPAA compliance.

### 1.4 Non-goals (MVP)
Venue-owner marketplace, AI features of any kind, spiritual-risk scoring, Google Calendar sync (stub interface only), mobile apps, multi-organization tenancy, minors programs, public prayer wall.

## 2. Roles and capabilities

Roles are bundles of capabilities. Checks use capabilities, never role names.

| Role | Key capabilities |
|---|---|
| client | own records only |
| facilitator | `program:facilitate` (assigned cohorts), `attendance:write`, `announce:cohort` |
| chaplain | `care:provide` (assigned requests), `pastoral_notes:write`, `pastoral_notes:read_assigned`, `appointments:manage_own` |
| prayer_team | `prayer:read_assigned` (requests routed to prayer team; text decrypted only here) |
| coordinator | `bookings:manage` (wedding, funeral) |
| event_planner | `bookings:manage` (event), `venues:manage` |
| finance | `payments:read`, `invoices:manage`, `scholarships:decide` |
| program_admin | `programs:manage`, `cohorts:manage`, `resources:manage` |
| reporting | `reports:read` (aggregates only) |
| super_admin | all above except reflection reads; `pastoral_notes:break_glass` (requires typed reason, audit logged, notifies note author) |

Users may hold several roles. `user_roles` granted only by super_admin; every grant/revoke audit logged.

## 3. Data model (MongoDB)

### 3.1 Conventions
- `_id`: ObjectId. All docs: `createdAt`, `updatedAt` (UTC Date). Soft delete via `deletedAt` where noted.
- Money: integer minor units (`amountCents`) + `currency`.
- Times: UTC `Date` plus IANA `tz` on anything scheduled.
- Every collection has a zod schema in `src/server/data/schemas/` and a matching `$jsonSchema` validator applied by `scripts/db-ensure.ts` (idempotent; also creates indexes).
- Encrypted fields stored as `{ v: 1, kid, iv, tag, ct }` (base64). Never indexed, never projected outside the owning repository.
- Multi-document writes that must be atomic (payment confirmation, enrollment + seat count) use transactions (Atlas is a replica set; tests use `MongoMemoryReplSet`).

### 3.2 Collections
Identity: `users`, `accounts`, `sessions`, `verification_tokens` (Auth.js adapter), `user_roles`, `profiles` (display name, phone, tz, comm prefs, adult attestation), `provider_profiles` (bio, tradition, verified credentials list with `verifiedBy`/`verifiedAt`, languages, service area, ceremony styles, licensed flag, published flag).
Catalog: `service_categories`, `services` (slug, category, summary, body ref, eligibility, intake form key, active), `service_packages` (service, name, session count, minutes per session, duration weeks, channels, response time text, included items, price, deposit rule, installments allowed, Stripe price id, active).
Intake: `intake_forms` (key, version, field definitions), `service_requests` (requester, service, package?, answers (non-sensitive, schema-limited), status, assigned provider ids, history[]), `referrals`, `consent_records` (subject, type, text version hash, granted, revokedAt).
Program: `programs`, `program_tracks` (standard / intensive / hybrid / self-paced; computed session count), `program_cohorts`, `program_lessons` (week, order, content ref, scripture refs, release offset), `program_enrollments`, `lesson_progress`, `group_sessions`, `session_attendance`, `private_reflections` (owner, lesson?, encrypted body, sharedWith[] explicit).
Care: `pastoral_notes` (client, author, encrypted body, minimal category enum), `appointments`, `provider_availability` (weekly rules + exceptions, tz).
Bookings: `bookings` (type: wedding | funeral | event; requester; status; type-specific `details` subdoc validated per type; quote ids; agreement id), `ceremony_packages`, `venues`, `venue_availability`.
Money: `quotes`, `invoices`, `payments`, `subscriptions`, `scholarships`, `stripe_events` (unique event id for idempotency).
Content: `resources`, `devotional_plans`, `prayer_requests` (encrypted text, private default, `publicConsent` separate record), `testimonials` (consent record id required to publish), `events` (public listings).
System: `organization_settings` (singleton), `notifications`, `email_outbox`, `audit_logs`, `rate_limits` (TTL index), `files.*` (GridFS bucket `private_files`).

## 4. Public website

### 4.1 Pages
Home, About (mission, vision, foundation, philosophy, leadership, credentials, statement of faith, ethics and confidentiality), Services (filterable directory + `/services/[slug]`), Programs (+ renewal landing), Weddings, Funerals and Memorials, Chaplaincy (incl. hospice), Prayer Requests, Events and Retreats, Resources, Contact. Legal: privacy, terms, cancellation, refund, accessibility, service scope.
### 4.2 Content source
Long-form copy lives in `src/content/*.mdx` until admin CMS exists (§12.4). Org-supplied facts (leaders, credentials, statement of faith) are placeholders marked `TODO(org)` and render a visible "content pending" block in non-production. Never invent them.
### 4.3 Home
Hero with "Request Spiritual Care" and "Explore Programs"; service categories; featured 4- and 8-week renewal; weddings and funerals; family and marriage; chaplaincy; events (from `events`); testimonials only if published with consent (section hidden otherwise); mission and values; footer.
### 4.4 Design system
Ivory/off-white background, deep forest green primary, restrained gold accent, charcoal text. Serif display + humanist sans body (chosen in ADR). Tokens as CSS variables in `globals.css`, mapped in Tailwind config. Rounded-lg corners, generous spacing, subtle transitions respecting `prefers-reduced-motion`. No heavy gradients, no oversized empty hero, no SaaS-dashboard look on public pages. Photography: org-supplied or licensed; placeholders are neutral tinted blocks, never fake people.

## 5. Intake engine (all care, counseling and family services)

### 5.1 Forms as data
`intake_forms` define fields (type, label, help, required, options, maxLength, `sensitive: false` always). Renderer builds React Hook Form + zod from the definition. Free-text fields capped at 500 chars, with helper text "Please share only what you're comfortable with; details can be discussed privately."
### 5.2 Service types
General spiritual support, hospital chaplaincy, hospice and end-of-life, caregiver support, family spiritual care, spiritual direction, grief and bereavement, crisis-related pastoral support, ministry burnout, faith questions, prayer and Scripture encouragement, ongoing monthly support, individual pastoral counseling, premarital (4/6/8/12 sessions), marriage enrichment, parenting/family, singles and relationship formation, ministry leadership, mentorship, church hurt. Each is a `services` doc + form key; packages carry session count, length, channels, response time, inclusions, price.
### 5.3 Hospice path
Extra fields: requester relationship (self / family / authorized representative / facility staff), setting, preferred support (patient, family, life review, prayer, caregiver, family meeting, funeral planning, bereavement follow-up). Notice: complements the hospice clinical team.
### 5.4 Family and couples
Form asks who participates and who the client is. Confidentiality summary shown; each adult participant gives their own consent before the first session (consent_records per person).
### 5.5 Referral
Providers can mark a request "Referred to another provider" with a referral record (category, provider name optional, note not stored as free text beyond 200 chars).
### 5.6 Status machine
`submitted -> under_review -> awaiting_consultation | awaiting_quote -> awaiting_payment -> confirmed -> in_progress -> completed`; `cancelled` and `referred` reachable from any non-terminal. Defined once in `src/domain/status.ts`; every transition validated and appended to `history`.
### 5.7 Anonymous submission
Visitors may submit without an account (rate-limited, email verification link to claim the request into an account). No payment required to submit any inquiry.

## 6. Spiritual Renewal Program

### 6.1 Program
"The Wellspring Spiritual Renewal Journey" - "Healing the wounded soul. Restoring faith. Renewing hope." Curriculum content: `docs/content/renewal-curriculum.md` (seed source; read only by curriculum tasks). Landing page states it is not a cure for trauma nor a substitute for licensed mental-health care.
### 6.2 Tracks
Configurable per program: standard (1/week), intensive (2/week), hybrid (1 group + optional individual), self-paced. Session count computed (`weeks x sessionsPerWeek`) and shown with duration, format, inclusions and extra costs before enrollment (e.g. "4-week intensive: 8 facilitated sessions").
### 6.3 Enrollment wizard
Steps: program and track; format (in-person / virtual / hybrid); schedule (cohort pick or preference); individual or group; optional facilitator preference; accommodations (choice list + 200 chars); contact; terms and consent (consent_records). No trauma history questions. Payment step (§8) or scholarship request. Enrollment is `pending_payment` until webhook confirms.
### 6.4 Participant portal
Upcoming sessions, released lessons (release = cohort start + offset), Scripture and devotionals, downloads (GridFS via authorized route), reflections (private, encrypted, explicit share to a named facilitator only), lesson completion, book included check-ins, announcements, payment and enrollment status, withdraw / request support. Completion: certificate of participation PDF labeled "not a professional credential".
### 6.5 Facilitator portal
Assigned cohorts only: participants (name, enrollment status, attendance, completion %; never reflections unless shared), attendance marking, lesson release overrides, group session scheduling, permitted check-ins, minimal pastoral notes (§3.2), announcements, completion and follow-up.

## 7. Scheduling

- Provider weekly availability rules + date exceptions in the provider's tz. Slot generation in `src/domain/scheduling.ts` (pure, tested across DST transitions).
- Appointment: client, provider, type, start/end UTC, tz, channel, location or meeting link (link stored, shown only to participants), status (requested / confirmed / cancelled / completed / no_show), cancellation window from policy.
- Double-booking prevented with a unique index on `(providerId, slotStart)` for active appointments plus overlap check in a transaction.
- Reminders via Vercel Cron `/api/cron/reminders` (protected by `CRON_SECRET`): 24h and 1h emails.
- Google Calendar: `CalendarProvider` interface + no-op implementation; real sync out of MVP.

## 8. Payments

- Stripe Checkout (hosted) for one-time, deposits, installments (as Stripe subscription with fixed iterations or invoice schedule, chosen in ADR), and memberships (subscriptions).
- Prices live in `service_packages` / `ceremony_packages`; admin edits create a new Stripe Price and archive the old (Prices are immutable).
- Webhook `/api/webhooks/stripe`: raw body, signature verified, idempotent via `stripe_events`, handles `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated|deleted`, `charge.refunded`. Only the webhook sets paid states.
- Quotes (line items, expiry) -> accepted -> invoice (deposit + balance) -> payments.
- Scholarships: request form (reason category + 300 chars), finance decides, approved scholarship applies a Stripe coupon or marks enrollment `scholarship_full`.
- Sliding-scale and hardship option shown on funerals and programs.
- Dev mode: without `STRIPE_SECRET_KEY` checkout buttons show "Payments not configured" and admins can mark test payments only when `NODE_ENV !== "production"`, labeled as such.
- Initial suggested prices (admin-editable, all seeded inactive until reviewed): pastoral session $60-100, 4-week renewal $149-249, 8-week $299-449, wedding officiating $250-600, funeral officiating $200-500, events by quote, organizational chaplaincy by retainer.

## 9. Bookings (weddings, funerals, events)

### 9.1 Shared pipeline
`inquiry -> availability_check -> quoted -> agreement_signed -> deposit_paid -> confirmed -> completed`, plus `cancelled`, `declined`. Venue states are separate: `inquiry`, `quote`, `reserved`, `deposit_paid`, `confirmed`. Agreement: generated PDF with typed-name e-acceptance, IP and timestamp stored (not a qualified e-signature; ADR records the choice).
### 9.2 Weddings
Ceremony types from the brief as data. Catholic and Orthodox are "inquiry - referral" types: copy explains coordination with authorized clergy and that the church has its own requirements. Officiant profiles (§3.2 provider_profiles) show only verified credentials. Add-ons as data. Marriage-license checklist is per-jurisdiction data with source URL and last-verified date, shown with "not legal advice"; Massachusetts entry seeded as `unverified`.
### 9.3 Funerals and memorials
Types: funeral officiating, memorial, graveside, celebration of life, Christian funeral, family prayer, eulogy preparation, planning consult, bereavement support (one-time, 4, 8, 12 weeks), hospice follow-up. Settings: virtual, home, funeral home, church, cemetery, other. No payment before inquiry; hardship option. Copy tone: gentle, short sentences.
### 9.4 Events and venues
Event types and inquiry fields per the brief. Venues admin-managed only; disclaimer that the organization does not own listed venues unless flagged `owned: true`.

## 10. Prayer ministry and resources
- Prayer requests: private by default, encrypted text, routed to prayer_team; requester chooses follow-up preference. Public sharing requires a separate consent record and admin approval; MVP has no public display.
- Resources: devotionals, reading plans, articles, prayer guides, meditation guides; admin-managed (MDX body + optional private file); visibility public / members / enrolled.
- Devotional plans: day-indexed entries; enrollment sends daily email only if the user opted in.
- Bible study, discipleship, mentorship, small groups, theology questions: services in the intake engine, no bespoke modules.

## 11. Client portal
Profile, requests and statuses, appointments (book, cancel within policy), enrollments, purchased resources, invoices and payment history, pay balance, agreements, follow-up request, communication preferences, data export (JSON of own records, reflections decrypted) and account deletion request (finance records retained per policy; ADR on retention).

## 12. Staff dashboard
### 12.1 Metrics (aggregates only)
New inquiries, active care plans, enrollments, upcoming appointments, bookings by type and status, revenue and outstanding balances, subscription states, attendance, referrals, cancellation rate.
### 12.2 Management
Services, packages, prices, programs, lessons, cohorts, providers and assignments, request review and assignment, calendars, venues, quotes, invoices, scholarships, announcements, testimonials with consent, settings, user roles.
### 12.3 Audit log viewer
Super admin only; filters by actor, action, date. Entries never show decrypted content.
### 12.4 Content editing
MDX editing for resources and selected page blocks; full CMS out of MVP.

## 13. Security and privacy

### 13.1 Authorization layer
Repositories receive `AuthContext { userId, capabilities, assignments }`. Each read method adds an owner or assignment filter; there is no unscoped `find` export. Tests in `test/authz/` assert cross-user reads return null for every repository (IDOR suite, run at every GATE).
### 13.2 Auth
Auth.js with MongoDB adapter, database sessions, email magic link (Resend) and optional Google. Session cookie httpOnly, secure, sameSite=lax. Staff roles require re-auth within 12h for staff routes.
### 13.3 Field encryption
AES-256-GCM via node:crypto, 96-bit random IV, key from `FIELD_ENC_KEY` (base64 32 bytes) with `kid` for rotation. Protects against database dumps and DB-console browsing; does not protect against someone with server env access (documented honestly in the privacy page draft).
### 13.4 Files
GridFS `private_files`; served only by `/api/files/[id]` after authz; `Cache-Control: private, no-store`; mime allowlist (pdf, png, jpg, webp); 10 MB cap; filenames never in URLs.
### 13.5 Abuse controls
Rate limit public forms and auth endpoints (Mongo `rate_limits`, fixed window, TTL). Honeypot field + timing check on public forms. Server actions rely on Next's origin check; route handlers that mutate check `Origin`. CSP headers in `next.config` (strict; Stripe domains allowed).
### 13.6 Logging and analytics
Structured logger with field allowlist. Analytics (if added) gets page paths only; no form contents, no request types. Audit log for: role changes, break-glass, note access, exports, deletions, refunds, settings changes.
### 13.7 Retention
Default policy (ADR): inquiries 3 years after close, pastoral notes 7 years then purge, reflections deleted on owner request immediately, financial records 7 years. Purge job via cron.

## 14. Notifications
Templates (React Email): verification, magic link, inquiry received, consultation booked, reminder, cancellation, enrollment confirmed, lesson released, receipt, payment failed, quote ready, wedding confirmed, funeral confirmed, event registration, renewal notice, scholarship decision, follow-up invitation. Subjects and bodies are generic ("Your request was received"); details only behind login. Dev transport writes to `email_outbox`, viewable at `/dev/outbox` in development only. In-app notifications collection. Users opt out of non-essential categories.

## 15. Accessibility and copy
### 15.1 WCAG 2.2 AA targets: keyboard paths, visible focus, labeled inputs, accessible dialogs (shadcn/Radix), contrast, reduced motion, clear errors, accessible date/time pickers, 44px targets.
### 15.2 Responsive: 360, 768, 1280 px checked on primary flows.
### 15.3 Copy checklist: no outcome guarantees, no "therapy" unless licensed, no invented credentials or endorsements, emergency notice present on intake, faith traditions named accurately.

## 16. Reporting
Aggregates only, minimum cell size 5 for any breakdown. Never sourced from notes, reflections or prayer text.

## 17. Configuration and dev modes
`.env.example` lists every variable with comments. `src/server/config.ts` validates env with zod at boot and exposes `integrations: { stripe, email, googleCalendar }` booleans. Admin settings page shows each integration as Configured / Not configured, never fakes it.
