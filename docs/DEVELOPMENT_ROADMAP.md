# Development roadmap

## Phase 1 — Foundation (preserved)

React/Vite client, responsive shell, account registration/login, JWT middleware, Mongoose User and Language models, profile/preferences APIs, health endpoint, and environment template.

## Phase 2 — Language infrastructure (implemented foundation)

Independent Language, LanguageVariety, and Script models; public filtered catalog APIs; role-protected language/script management foundations; user known/native/learning/preferred-variety selections; discovery, details, and settings interfaces; draft-only development seed; data and API documentation. Alphabet learning, characters, and courses are intentionally not included.

## Phase 3 — Learning

Language-specific character categories and graphemes, writing practice, pronunciation, courses, lessons, activities, quizzes, vocabulary, and progress. These should reference language, optional variety, and script and retain review provenance.

## Later phases

Consent-aware voice features, community contribution and review, cultural resources, moderation, accessibility/performance audits, deployment, and monitoring.

## External setup

Set `MONGODB_URI` and a long random `JWT_SECRET` in `server/.env`. Email delivery, OAuth, media storage, and speech providers remain unconfigured and are not represented as working features.
