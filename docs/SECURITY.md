# Security and privacy controls

## Authentication and browser sessions

The API issues an `HttpOnly` `mb_session` cookie with `Secure` and `SameSite=None` in production, and a development-safe cookie for localhost. The bearer token is no longer returned to JavaScript or stored in `localStorage`; users with older sessions must sign in again. Mutating requests must carry the signed double-submit `mb_csrf` token in `X-CSRF-Token`. Mutating cross-origin requests are restricted to exact `CLIENT_ORIGIN` entries. Logout increments the account's `authVersion`, invalidating all previously issued sessions for that account.

Password hashing uses bcrypt. Registration does not accept a role field; elevated roles must be assigned through a trusted operational process. Password reset, refresh tokens, email verification, and MFA are not implemented. Use an identity provider or implement these controls before offering high-risk accounts in production.

## Request protections

- Helmet response headers, exact CORS origins, 1 MB JSON limit, route-specific raw-audio limit, request IDs, safe query parsing, and rejection of Mongo operator/dotted field names in JSON bodies.
- General API limit: 300 requests per minute per resolved client IP. Authentication remains limited to 30 requests per 15 minutes. Discussion, contribution, and tutor routes have additional limits.
- `TRUST_PROXY_HOPS` defaults to 0. Set it only to the exact trusted proxy hop count; never trust arbitrary forwarded headers from direct clients.
- API errors return a generic 5xx message with a request ID. Server logs include request metadata and error code/name, not request bodies, tokens, or MongoDB URIs.
- User-scoped reads and writes must continue to include the authenticated user's ID in database filters. Cultural access is checked before serialization and again before protected media delivery.

Rate limiting uses the process-local store. A horizontally scaled deployment needs a shared rate-limit store or gateway limit before multiple instances are exposed.

## Secrets and deployment

Use `docs/ENVIRONMENT_VARIABLES.md`. Keep `server/.env` outside version control, use a unique random `JWT_SECRET` of at least 32 characters, set production frontend origins to HTTPS, terminate TLS at a trusted proxy, and restrict database network access. Do not put server variables in `VITE_*` client configuration. The `.env.example` values are placeholders and startup rejects its sample JWT secret.

## Media and cultural privacy

Audio currently uses private local filesystem storage with randomized names, signature checks, a 10 MB limit, and access checks. It is not a durable cloud object store. Public HTTPS image/video links are not private storage. Do not use these facilities to host restricted production recordings until a private, durable media adapter, retention controls, backup coverage, and signed/authorized delivery have been implemented and reviewed.

Do not cache private learner records, restricted cultural content, community discussions, API responses, or media in a shared cache. The service worker caches only the public app shell and hashed static assets.

## Verification status

These controls have unit-level coverage in the local test suite, but no independent penetration test, dependency advisory scan, external proxy/CORS test, or production cookie/domain test has been completed. `npm audit` could not contact the npm registry in the audit environment. Do not represent this document as a security certification.
