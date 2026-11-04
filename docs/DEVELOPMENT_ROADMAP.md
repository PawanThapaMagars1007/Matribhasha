# Development roadmap

## Phase 1 — Foundation (preserved)

React/Vite client, responsive shell, account registration/login, JWT middleware, Mongoose User and Language models, profile/preferences APIs, health endpoint, and environment template.

## Phase 2 — Language infrastructure (implemented foundation)

Independent Language, LanguageVariety, and Script models; public filtered catalog APIs; role-protected language/script management foundations; user known/native/learning/preferred-variety selections; discovery, details, and settings interfaces; draft-only development seed; data and API documentation. Alphabet learning, characters, and courses are intentionally not included.

## Phase 3 — Alphabet, writing systems, and pronunciation (implemented foundation)

Configurable character categories and orthographic units, reviewed character browsing, pronunciation and approved audio, local freehand and microphone practice, recognition/matching/listening sessions, and per-user progress. Alphabet information is not seeded; communities and experts must provide and review it.

## Phase 4 — Vocabulary and sentence learning (implemented foundation)

Vocabulary categories and entries, contextual meanings, multiple reviewed translations, example sentences, language grammar categories/lessons, and sentence exercises. Public dictionary, vocabulary, grammar, sentence, and sentence-practice APIs filter live content; exercise answers stay server-side. Signed-in saved words, vocabulary spaced-repetition reviews, grammar progress, and sentence progress are private per user. Learner pages cover vocabulary/flashcards, multilingual dictionary search, grammar, and sentences. Content editor/reviewer endpoints use role checks and revision snapshots. No linguistic content is seeded; empty states are expected until experts publish records.

## Phase 5 — Complete learning system (implemented foundation)

Language/variety-scoped courses and ordered modules/lessons; reusable lesson blocks; authenticated enrolments, prerequisites, sequential completion, progress, and resume position; server-side assessment scoring and retakes; approved-audio listening exercises; metadata-only speaking history with browser-local recordings; verified guided conversation scenarios; private rate-limited optional tutor with verified-content fallback; revision queue, configurable achievement rules, certificate issuance and privacy-preserving verification. Course content is drafted and reviewed through role-protected APIs. AI stays optional and no AI-generated content is published. See `docs/COURSE_MANAGEMENT.md`, `docs/LEARNING_PROGRESS.md`, `docs/AI_TUTOR.md`, and `docs/PRIVACY_AND_AUDIO.md`.

## Later phases

Consent-aware voice features, community contribution and review, cultural resources, moderation, accessibility/performance audits, deployment, and monitoring.

## External setup

Set `MONGODB_URI` and a long random `JWT_SECRET` in `server/.env`. Email delivery, OAuth, media storage, and speech providers remain unconfigured and are not represented as working features.
