# Production readiness audit

**Audit baseline:** 4 November 2026. Read-only review of the checked-out `main` branch before Phase 7 implementation. The working tree was clean. This is an engineering audit, not a penetration test, accessibility certification, dependency scan result, or deployment verification.

## Summary

The repository has a coherent MERN structure and substantial language-learning and cultural-content foundations. It is **not production-ready yet**. The main blockers are weak startup configuration guarantees, stateless browser-stored bearer tokens, local-only audio storage, missing operational observability and recovery, and insufficient automated coverage for API authorization and cross-phase flows.

## Findings by priority

### Critical

- **Production startup accepts missing or unsafe secrets.** `server.js` logs a warning and starts without MongoDB configuration; JWT signing and verification depend on `JWT_SECRET` without startup validation. The example secret is a placeholder. A copied placeholder or weak secret can permit token forgery; a missing database can leave an apparently running but unusable service.
- **Authentication tokens are exposed to browser JavaScript.** The client stores bearer JWTs in `localStorage`. Any successful script injection can read and exfiltrate a still-valid token. Logout removes only the local copy; issued tokens remain valid until expiry, and there is no refresh or revocation flow.
- **Production media durability and privacy are not provided.** Audio is stored on the application host's local filesystem. It is not a replicated or managed private object store, has no quota/retention controls, and is not included in a documented backup procedure. Images and video accept external public HTTPS links only.

### High

- **No readiness or dependency-aware service checks.** `/api/health` always responds successfully and reports connection state in its body; there is no `/health/ready` gate for deployments. The server has no graceful shutdown handling or explicit pool configuration.
- **Operational logging and error handling are not production-safe.** Errors are printed with `console.error(error)`, with no request ID or structured redaction policy. Startup logs the raw connection error message. There is no configured log retention, alerting, or error-reporting integration.
- **Rate limiting is incomplete for the API surface.** Authentication has a limiter, with a few additional route-specific limits, but many expensive search, learning, and account endpoints have no general limit. Proxy trust is not configured, so IP-based limits can behave incorrectly behind a reverse proxy.
- **Integration/security coverage is thin.** The existing suite has 22 Node tests, primarily model validation and a few pure service checks. It does not exercise authentication, authorization boundaries, request parsing, database workflows, upload routes, or cross-phase journeys. A separate test database and E2E harness are absent.
- **Some query validation and pagination are inconsistent.** Several routes pass query values into Mongoose filters directly or silently ignore malformed IDs; public listing limits differ. The default Express query parser can represent bracketed query parameters as nested objects, so query values need a consistent scalar schema.
- **Assessment attempt limits can race.** The number of attempts is counted before a separate insert. Concurrent submissions may exceed configured retake limits unless attempt allocation is made atomic.

### Medium

- **Initial frontend bundle is monolithic.** The latest Phase 6 build produced about 389 KB of JavaScript (about 114 KB gzip); all page routes are imported eagerly. There is no route-level lazy loading, error boundary, or documented cache policy.
- **PWA and offline behavior are absent.** There is no manifest, install icon set, service worker, or offline fallback. No private-data cache risk currently exists because there is no service worker.
- **Interface localization is incomplete.** User preferences store an interface-language value, but most UI strings are inline English. Learned content is stored separately, but there is no translation catalog or completeness check.
- **Monitoring and search-performance review are incomplete.** There is no request tracing, structured access log, metrics integration, or search benchmark. Some cultural and discussion list paths perform per-record permission/profile lookups.
- **SEO is mostly static.** The HTML shell has one generic title/description and there is no sitemap, robots policy, canonical URL strategy, or route-specific public metadata.
- **Accessibility and mobile verification are not systematic.** Existing responsive styles and semantic controls exist, but there is no automated axe/WCAG audit or documented screen-by-screen mobile/keyboard verification.
- **Phase 6 operations are only partially surfaced.** Content review has a page, but report and takedown queues lack complete operator screens. Some contribution, discussion, and withdrawal management remains API-only.

### Low

- **Root package metadata has no lockfile.** Client and server lockfiles are present; the root package declares only the development runner. Reproducible root-level installation should be confirmed in CI.
- **Several planned account services are intentionally unavailable.** Password reset, refresh tokens, email verification, external media storage, and email delivery are not configured. These must remain clearly unavailable rather than presented as operational.

## Checks performed

- Inspected the app, routes, models, auth middleware, audio storage, environment template, docs, and Git ignore/tracking state.
- Confirmed `.env.example` is the only tracked environment-named file found; `.env` files and local audio storage are ignored.
- Counted 176 route declarations and 71 explicit schema index declarations; these counts are inventory only, not proof that every route is safe or every index is useful.
- `npm ls --depth=0` completed for client and server with installed dependencies matching their local manifests.
- `npm audit` could not reach `registry.npmjs.org` from this environment, so dependency vulnerability status is **unknown**, not clean.
- The post-implementation test and build results are recorded in the Phase 7 implementation status below.

## Implementation plan

1. Enforce production startup configuration, safe query parsing, body limits, global/request-specific rate limits, request IDs, readiness checks, redacted errors, and graceful shutdown.
2. Harden authentication/session behavior without breaking existing sign-in flows; add revocation support and tests. Document the remaining trade-offs of browser token storage unless an HTTP-only cookie migration can be safely completed in this phase.
3. Review user scoping, validation, pagination, attempt limits, and high-volume query patterns; add indexes only for demonstrated filters and keep restricted cultural content out of shared caches.
4. Split frontend routes, add error/loading handling, and implement a static-only PWA cache. Review keyboard/focus, labels, reduced motion, contrast, and mobile layout; document items that still require human/device testing.
5. Complete report and takedown operator screens and tighten their authorization checks.
6. Add configuration, backup/restore, test, deployment, accessibility, PWA, security, and performance guides. Add deterministic tests that do not require production data; run database integration tests only when a separate test URI is explicitly configured.
7. Re-run the backend suite, production client build, route import checks, and a final configuration/security review. Report any cloud storage, DNS/HTTPS, backup, vulnerability scan, device, and deployment checks that cannot be performed locally.

## Current readiness decision

**Not ready for production deployment.** Local development is supported. Production requires a validated secret and database, private durable media storage and recovery, operational monitoring, a completed API security review, and real deployment/device testing. The implementation status below records completed work and controls that have not been externally exercised.

## Phase 7 implementation status (4 November 2026)

### Implemented and locally tested

- Startup rejects missing MongoDB configuration, weak/placeholder JWT secrets, malformed origins, and invalid runtime limits. Production frontend origins require HTTPS.
- Browser authentication uses an HttpOnly session cookie, a signed CSRF cookie/header pair, JWT issuer/audience/algorithm checks, and a database-backed auth version so logout revokes the current session. The client no longer stores a JWT in localStorage and clears a legacy token if present.
- Express now has exact credentialed CORS, Helmet headers, bounded JSON requests, scalar query parsing, unsafe body-key rejection, global and auth rate limits, request IDs, redacted error responses, liveness/readiness routes, Mongo pool settings, and graceful shutdown.
- Cultural review now exposes separate report and takedown queues. Community review is scoped to community content; unscoped actions require a platform role. Approval validates access levels before persisting the outcome.
- Assessment attempts have a unique `(user, assessment, attemptNumber)` index to prevent duplicate allocation under concurrent requests. **Before deploying this index, inspect existing data for duplicate tuples and resolve them through an approved migration.**
- React page routes are lazy loaded; an app-level error boundary and update notice were added. The service worker caches only the app shell and same-origin static assets, and explicitly excludes API calls and media. English/Nepali shared navigation strings have a completeness test; page-wide translation remains partial.
- Created operational guides listed in the Phase 7 brief. No production deployment, external service, or destructive migration was run.

### Verification performed

- `npm test --prefix server`: **27 passed, 0 failed**.
- `npm test --prefix client`: **1 passed, 0 failed**.
- `npm run build --prefix client`: **passed**. Vite emitted a 255.27 kB shared JavaScript entry (85.22 kB gzip), with page routes split into separate chunks. This is a build measurement, not a real-user performance benchmark.
- `node --check` passed for the auth middleware, app setup, and cultural moderation routes.
- `npm audit` was attempted but registry access failed; vulnerability status remains **unknown**. No MongoDB integration tests or browser/device tests were run.

### Remaining limitations and readiness decision

**Not ready for production deployment.** Private durable object storage and permission-aware private image/video delivery are not configured; local audio storage is development-only. Monitoring/alerts, scheduled off-site backups, retention controls, restore rehearsal, real-domain HTTPS/proxy behavior, and live health checks must be configured and verified by the operator. There is no database API integration or end-to-end suite, and dependency advisories could not be fetched. Mobile layout, WCAG 2.2 AA, screen-reader behavior, contrast, translation quality, offline synchronization, and the full Phase 1–6 journeys still require human/device verification. The PWA deliberately does not persist learning progress offline, so it makes no offline progress-sync guarantee. Password reset, refresh tokens, email delivery, and media cloud credentials remain unconfigured.

To review locally, configure a dedicated development MongoDB and values in `server/.env`, run `npm install` for root/client/server if needed, then run `npm test` and `npm run build` from the repository root. Exercise registration, login, CSRF-protected writes, logout/revocation, readiness during DB outage, cultural review/takedown authorization, and audio permission checks against an isolated non-production database before release. Follow `docs/DEPLOYMENT.md`; do not test migrations or restores against production data without an approved recovery plan.
