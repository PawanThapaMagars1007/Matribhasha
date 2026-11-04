# Testing guide

## Local checks

From the repository root:

```powershell
npm test
npm run build
```

The server tests exercise model validation, selected access-control logic, environment validation, CSRF token helpers, and request middleware. The client test checks shared English/Nepali navigation-string completeness. The Vite build verifies static client compilation and route splitting.

## Database tests

The automated suite does not connect to MongoDB. There are no database API integration or browser end-to-end tests yet. Do not run integration tests against production or a user's data. When a test database is available, use a separate `matribhasha_test` database with a dedicated least-privilege account and test fixtures. Add a guard that refuses to run if the URI points at production before creating or cleaning test records.

The current test strategy does not yet cover complete registration/login/logout, role escalation, concurrent assessment submissions, culture publication, contribution withdrawal, discussion moderation, or media delivery against MongoDB. Validate these manually in an isolated deployment until deterministic integration tests exist.

## Dependency checks

`npm audit` was attempted during this audit but could not connect to `registry.npmjs.org`; dependency advisories remain unknown. Re-run `npm audit` from an environment with registry access and review fixes before release. Do not blindly apply major-version updates.
