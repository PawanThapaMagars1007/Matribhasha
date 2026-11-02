# Development roadmap

## Phase 1 — Foundation (current)

React/Vite client, responsive visual system and navigation, account registration/login, JWT middleware, Mongoose User and Language models, profile/preferences APIs, health endpoint, environment template, and architecture docs. Email verification, OAuth, password reset, token refresh, and media are not configured.

## Phase 2 — Language infrastructure

Varieties, scripts, alphabet categories, characters, phonemes, recording metadata, admin CRUD with backend role checks, contribution provenance and review. Add only sourced or clearly unreviewed language content.

## Phase 3 — Learning

Courses, lessons, activities, quizzes, vocabulary, dictionary, grammar, bookmarks and progress calculated from completed activities.

## Phase 4 — Voice

Consent-aware recording, native audio playback, storage adapter, provider capability registry for speech/AI, and manual fallback for unsupported languages.

## Phase 5 — Community

Contributions, review queues, revision history, cultural resources, reporting, permissions and moderation.

## Phase 6 — Advanced

Supported AI conversations, speech services only for validated languages, offline learning, recommendations and analytics.

## Phase 7 — Finalization

Automated tests, threat review, accessibility and responsive audits, performance, deployment docs and operational monitoring.

## External setup

Phase 1 needs a MongoDB URI and JWT secret. Email delivery is needed for verification/reset. Cloudinary or S3 is needed for audio/image persistence. Speech and AI credentials, if used later, remain backend-only and must be selected after verifying language coverage and consent requirements.
