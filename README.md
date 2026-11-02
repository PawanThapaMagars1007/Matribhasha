# मातृभाषा · Matribhasha

**Learn your roots. Discover new languages.**

Matribhasha is a MERN platform for learning, speaking, writing, and preserving the languages and cultural knowledge of Nepal. The project is being built in phases. This repository currently contains the Phase 1 foundation: a responsive React experience, MongoDB/Mongoose models, Express API, JWT-based sign-up and sign-in, profile preferences, and a data-driven language catalog endpoint.

## Requirements

- Node.js 20 or newer
- MongoDB 6 or newer, local or hosted
- npm

## Setup

1. Copy `.env.example` to `server/.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.
2. Install dependencies from the repository root, `client`, and `server` with `npm install` in each folder.
3. Run `npm run dev` from the root. The React app runs at `http://localhost:5173`; the API runs at `http://localhost:5000`.
4. `GET /api/health` reports API and database availability.

If MongoDB is not configured, the server can start in API-only mode, but registration, login, profile, and catalog operations need a database connection.

## Current API

- `POST /api/auth/register`, `/login`, `/logout`, `/refresh`, `/forgot-password`, `/reset-password`
- `GET /api/auth/me`
- `GET /api/users/profile`, `PUT /api/users/profile`, `PUT /api/users/preferences`
- `GET /api/languages`, `GET /api/languages/:id`, `GET /api/languages/:id/varieties`, `GET /api/languages/:id/scripts`
- `GET /api/health`

Registration returns a short-lived bearer JWT. Passwords are hashed with bcrypt. Keep the JWT secret private. Email verification, password reset delivery, Google sign-in, refresh-token rotation, media storage, and account deletion are not configured in this foundation and are not represented as operational features.

## Architecture

- `client/`: React, React Router, Axios, Tailwind build setup, and shared responsive design system.
- `server/src/routes/`: Express REST endpoints and request validation.
- `server/src/models/`: Mongoose schemas for users and languages.
- `server/src/middleware/`: authentication, roles, and centralized error responses.
- `docs/`: system, data, API, language-content, and delivery guidance.

## Next

See [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md). The next phase is configurable languages, varieties, scripts, alphabet categories, and characters. Native pronunciation, translations, and writing instructions must be sourced and reviewed by knowledgeable contributors before being presented as verified content.
