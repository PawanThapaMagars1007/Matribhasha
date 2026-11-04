# Deployment guide

This repository has a Vite static frontend and an Express API. No live deployment target, domain, storage account, or credentials are configured. No production deployment has been performed.

## Prepare a release

1. Provision MongoDB with network allowlisting, authentication, TLS, backups, and a least-privilege application account.
2. Provision a host for the Node API and a static frontend host. Use a supported Node.js version (20 or newer) and the MongoDB Database Tools for recovery operations.
3. Set API environment variables from `docs/ENVIRONMENT_VARIABLES.md`. Use a new strong `JWT_SECRET`, `NODE_ENV=production`, exact HTTPS `CLIENT_ORIGIN` values, `MONGODB_URI`, and the correct `TRUST_PROXY_HOPS` value.
4. Install dependencies from the client and server lockfiles. Run `npm test` from the repository root and `npm run build`.
5. Publish `client/dist` to the frontend host with SPA history fallback to `index.html`, HTTPS, the included `manifest.webmanifest`, `sw.js`, `offline.html`, and `robots.txt`.
6. Start the API with `npm start --prefix server`. It connects to MongoDB before accepting traffic. Configure the proxy to forward HTTPS correctly, preserve `Origin`, and route `/health` and `/health/ready` to the API.
7. Verify `/health` returns 200 and `/health/ready` returns 200 only after MongoDB is available. Verify CORS credentials, login, CSRF-protected writes, logout revocation, audio permission checks, and browser install/update behavior on the real domains.
8. Configure a durable private media adapter and media backup before storing production audio. The existing local audio directory is not durable production storage.

## Runtime operations

Run at least one API instance until shared rate-limit storage is configured. Terminate TLS at a managed reverse proxy and set `TRUST_PROXY_HOPS` to the exact number of trusted hops. Configure proxy-level compression, request limits, access logs with sensitive headers redacted, health monitoring, alerts, and log retention. Do not enable a shared cache for API routes or cultural media.

Before rolling out the unique assessment-attempt index, verify existing records contain no duplicate `(user, assessment, attemptNumber)` tuples; see `docs/PERFORMANCE.md`. Do not run destructive index or data migrations automatically.

## Not configured

There is no Docker production image, Compose deployment, private cloud-media adapter, CDN, email service, external monitoring service, domain, DNS, TLS certificate, or managed MongoDB instance configured in this workspace. Choose these based on the eventual operator and community data policy. The `CLOUDINARY_*` variables are placeholders only and do not enable uploads.
