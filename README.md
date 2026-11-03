# मातृभाषा · Matribhasha

**Learn your roots. Discover new languages.**

Matribhasha is a MERN platform for learning, exploring, documenting, and preserving languages spoken in Nepal. Phase 3 extends the language foundation with reviewed writing units, flexible script-specific categories, pronunciation records, consent-reviewed audio, freehand writing practice, listening/recognition activities, and learner progress. Learning records are data-driven and are not seeded with invented alphabets or pronunciations.

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

## Phase 3 features

- Character categories and orthographic units are associated with languages, optional varieties, and scripts without assuming a universal alphabet.
- Public learning content is visible only after verification and publication.
- Learners can browse characters, hear approved recordings, practise drawing on a canvas, record their own voice locally, and complete recognition, matching, and listening questions from approved records.
- Progress tracks views and practice actions separately from explicit completion. Quiz answers are checked against server-held practice sessions.
- Audio uploads are signature checked, size limited, and require consent and attribution. Published audio is served only after review. Learner microphone recordings and canvas strokes are not uploaded.
- The development audio adapter writes approved files under `server/storage/audio/` (ignored by Git); replace it with durable private object storage for deployment. No storage credentials are required by the client.

## API

Authentication: `/api/auth/register`, `/login`, `/me`. User preferences: `/api/users/profile`, `/api/users/preferences`, `/api/users/languages`. Catalog: `/api/languages`, `/api/varieties`, `/api/scripts`. Learning content: `/api/characters`, `/api/pronunciations`, `/api/audio`, `/api/practice`. Expert content management: `/api/admin/learning`. See [docs/API.md](docs/API.md) for access and query details.

## Architecture and data care

- `client/`: React, React Router, Axios, Tailwind build setup, and responsive design system.
- `server/src/routes/`: Express APIs and request validation.
- `server/src/models/`: Mongoose account and language infrastructure models.
- `docs/`: architecture, database relationships, API, data guidelines, and roadmap.

Do not infer codes, language family, native names, script associations, or varieties. Unverified records remain unpublished. See [docs/LANGUAGE_DATA_GUIDELINES.md](docs/LANGUAGE_DATA_GUIDELINES.md).
