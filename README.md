# मातृभाषा · Matribhasha

**Learn your roots. Discover new languages.**

Matribhasha is a MERN platform for learning, exploring, documenting, and preserving languages spoken in Nepal. It now includes language-specific courses and learning paths, assessment and practice tools, and Phase 6 foundations for community-led cultural preservation, stories, oral history, contribution review, protected media, and moderated discussion. Learning content is not seeded with invented linguistic material.

## Requirements and setup

- Node.js 20 or newer, MongoDB 6 or newer, npm.
- Copy `.env.example` to `server/.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.
- Run `npm install` in the repository root, `client`, and `server`.
- Run `npm run dev` from the root. Client: `http://localhost:5173`; API: `http://localhost:5000`.
- `GET /api/health` reports API and database availability.
- `GET /health` is a liveness check; `GET /health/ready` waits for MongoDB readiness.
- Run `npm test` and `npm run build` from the repository root for local checks.
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

## Phase 4 features

- Reviewed vocabulary, contextual meanings, multiple translations, example sentences, and vocabulary pronunciation records.
- Dictionary search covers native forms, transliteration, alternatives, and verified definitions, with distinct target-language translations and context.
- Grammar lessons and sentence examples are shown only after review and publication; sentence translation strings are individually verified.
- Sentence exercises keep answers server-side and return only sanitized choices/tokens until answer submission.
- Signed-in users can save words, track vocabulary/grammar/sentence progress, and review vocabulary on a configurable spaced-repetition schedule.
- Authorized contributors prepare content through `/api/admin/content`; reviewers explicitly verify and publish. No linguistic content is seeded.

## Phase 5 features

## Phase 6 features

- Community-scoped cultural entries, stories, oral histories, and media carry language, variety, source, attribution, sensitivity, and access metadata.
- Community pages, cultural browsing, and contribution intake provide public-facing and contributor workflows.
- Separate linguistic, cultural, permission, and source reviews gate publication. Consent is recorded by scope; audio checks cultural access when streamed.
- Public, registered, approved-community, researcher, and individually granted access levels are supported. Non-public access is logged.
- Community membership requests, contributor privacy settings, notifications, discussions, reactions, reports, and withdrawal/takedown review are represented in the API.
- Audio uploads use private, signature-checked storage. Image/video contributions currently accept secure public HTTPS links only; private image/video uploads are not configured.

See `docs/CULTURAL_CONTENT_GUIDELINES.md`, `docs/COMMUNITY_CONTRIBUTIONS.md`, `docs/CONSENT_AND_MEDIA_POLICY.md`, `docs/MODERATION_GUIDELINES.md`, and `docs/ACCESS_CONTROL.md` for operating guidance. A consent checkbox is an intake assertion, not independent verification.


- Courses are scoped to a language and optional variety, with configurable ordered modules and lessons. Lesson blocks can reuse reviewed characters, vocabulary, grammar, sentences, approved audio, and assessments.
- Learners enrol, follow course prerequisites, complete lessons in sequence, resume progress, and see private dashboard activity.
- Assessment answer keys stay server-side; the backend checks answers, scores attempts, enforces retake limits, and records results.
- Listening requires verified, consent-recorded audio. Speaking recordings remain in the browser and are never uploaded; saved history contains only the target and learner self-assessment.
- Guided conversations use reviewer-published scenarios. The optional tutor reads `TUTOR_API_KEY`, `TUTOR_API_BASE_URL`, and `TUTOR_MODEL` on the server. Without a provider, it returns only matching approved Matribhasha content or explains that no verified answer is available.
- Achievements are rule-based and certificates are issued after configured completion requirements; public certificate lookup does not reveal learner identity.
- The development audio adapter writes approved files under `server/storage/audio/` (ignored by Git); replace it with durable private object storage for deployment. No storage credentials are required by the client.

## API

Authentication: `/api/auth/register`, `/login`, `/me`. User preferences: `/api/users/profile`, `/api/users/preferences`, `/api/users/languages`. Catalog: `/api/languages`, `/api/varieties`, `/api/scripts`. Learning content: `/api/characters`, `/api/pronunciations`, `/api/audio`, `/api/practice`. Expert content management: `/api/admin/learning`. See [docs/API.md](docs/API.md) for access and query details.

## Architecture and data care

- `client/`: React, React Router, Axios, Tailwind build setup, and responsive design system.
- `server/src/routes/`: Express APIs and request validation.
- `server/src/models/`: Mongoose account and language infrastructure models.
- `docs/`: architecture, database relationships, API, data guidelines, and roadmap.

Do not infer codes, language family, native names, script associations, or varieties. Unverified records remain unpublished. See [docs/LANGUAGE_DATA_GUIDELINES.md](docs/LANGUAGE_DATA_GUIDELINES.md).

## Phase 7 security and operations

The API validates required configuration before startup, uses revocable HttpOnly cookie sessions with CSRF checks, exact credentialed CORS, bounded JSON requests, query/body safeguards, rate limits, request IDs, safe error responses, and readiness checks. The client lazy-loads page routes, has an error boundary, and offers a static-asset-only PWA cache; private API responses and media are excluded. English and Nepali shared navigation strings are centralized, while full-page translation is incomplete.

Phase 7 is a production-readiness foundation, not a production certification. Durable private media storage, monitoring/alerting, scheduled backups, a live deployment, full database integration/E2E coverage, dependency advisory review, and device/accessibility verification still require external setup and operator validation. Read [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md), [docs/SECURITY.md](docs/SECURITY.md), and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) before deployment.
