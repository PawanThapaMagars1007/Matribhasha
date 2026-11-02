# Architecture

## Phase 1

The project uses a React SPA (`client`) and an Express REST API (`server`) backed by MongoDB through Mongoose. The API is independent of the browser client so future React Native clients can use the same routes. Frontend requests go through the Axios service; bearer tokens are attached from browser local storage. The server validates incoming payloads, hashes passwords with bcrypt, signs JWTs, and applies Helmet, CORS, and authentication rate limits.

## Boundaries

- React owns presentation and client navigation; backend authorization remains authoritative.
- Express routes validate payloads and delegate persistence to Mongoose models.
- Language-specific records live in MongoDB. UI components do not define language catalogs.
- Integrations for email, speech, AI, and object storage will be backend service adapters. No provider credentials belong in the client.

## Phase 1 limitations

JWT logout is client-side token removal; there is no server-side revocation list yet. Refresh, password reset, email verification, OAuth, and media providers require additional services and are explicitly unavailable until configured. Admin role middleware exists, but admin management routes are not yet implemented.
