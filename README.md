# मातृभाषा · Matribhasha

**Learn your roots. Discover new languages.**

Matribhasha is a MERN platform for learning, exploring, documenting, and preserving languages spoken in Nepal. The Phase 2 foundation adds independent language, variety, and writing-system records; reviewed public discovery; user language preferences; and role-protected catalog management foundations. It does not claim that courses, alphabet lessons, or pronunciation modules are available.

## Requirements and setup

- Node.js 20 or newer, MongoDB 6 or newer, npm.
- Copy `.env.example` to `server/.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.
- Run `npm install` in the repository root, `client`, and `server`.
- Run `npm run dev` from the root. Client: `http://localhost:5173`; API: `http://localhost:5000`.
- `GET /api/health` reports API and database availability.
- Optionally run `npm run seed --prefix server` to insert clearly marked, unpublished development language records.

## Phase 2 features

- Separate Language, LanguageVariety, and Script records, with optional classifications and verification sources.
- Published language discovery with search, region/availability filters, and pagination.
- Language detail pages with available varieties and writing systems.
- Multiple native, known, and learning language preferences; interface language is a separate setting.
- Server-side role checks for language and script management operations.

## API

Authentication: `/api/auth/register`, `/login`, `/me`. User profile and preferences: `/api/users/profile`, `/api/users/preferences`, `/api/users/languages`. Catalog: `/api/languages`, `/api/languages/:id`, `/api/languages/:id/varieties`, `/api/languages/:id/scripts`, `/api/varieties`, `/api/scripts`. See [docs/API.md](docs/API.md) for access and query details.

## Architecture and data care

- `client/`: React, React Router, Axios, Tailwind build setup, and responsive design system.
- `server/src/routes/`: Express APIs and request validation.
- `server/src/models/`: Mongoose account and language infrastructure models.
- `docs/`: architecture, database relationships, API, data guidelines, and roadmap.

Do not infer codes, language family, native names, script associations, or varieties. Unverified records remain unpublished. See [docs/LANGUAGE_DATA_GUIDELINES.md](docs/LANGUAGE_DATA_GUIDELINES.md).
