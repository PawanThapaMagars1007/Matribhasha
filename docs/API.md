# API

## Phase 5: courses, assessments, listening, speaking, conversations

- `GET /api/courses?language=&variety=&difficulty=` and `GET /api/courses/:id` discover published courses. `POST /api/courses/:id/enroll`; `GET /api/users/courses`; `GET /api/users/courses/:courseId/progress` are private.
- `GET /api/lessons/:id` requires an active enrolment and sequential prerequisites. `POST /api/lessons/:id/complete` explicitly saves completion; `PUT /api/lessons/:id/save` stores a private saved-for-later flag.
- `GET /api/assessments/:id` requires enrolment and omits answer keys. `POST /api/assessments/:id/submit` validates answers and returns the backend score/explanations. `GET /api/users/assessment-results` is owner-scoped.
- `GET /api/listening`, `GET /api/listening/:id`, `POST /api/listening/:id/submit` expose only approved recordings/exercises and use server-scored listening assessments.
- `POST /api/speaking/sessions` stores only target and self-rating metadata; `GET /api/speaking/history` returns only the signed-in user's records. Audio is not uploaded.
- `GET /api/conversations/scenarios[/:id]` reads published scenarios. `POST /api/conversations`, `GET /api/conversations[/:id]`, and `POST /api/conversations/:id/messages` are private. Tutor messages are limited to 8 per minute per client.
- `GET /api/users/learning-dashboard`, `/api/users/revision-queue`, `/api/users/achievements`, and `/api/users/certificates` are private. `GET /api/users/certificates/verify/:certificateId` returns course/completion validity without user identity.
- Reviewer endpoints: `/api/admin/courses` (GET/POST), `/api/admin/courses/:id` (GET/PUT), `/api/admin/courses/:id/modules`, `/api/admin/modules/:id/lessons`, `/api/admin/courses/:id/assessments`, `/api/admin/courses/:id/listening`, `/api/admin/languages/:languageId/conversations`, and `/api/admin/content/:type/:id/review`.

All user-owned records are filtered by the authenticated user. Course and activity reads require verified published content and approved audio. No answer keys are returned before submission.

## Phase 4: vocabulary, dictionary, grammar, and sentences

- `GET /api/vocabulary/categories?language=&variety=` lists live categories.
- `GET /api/languages/:languageId/vocabulary` and `GET /api/vocabulary/search?q=&language=&variety=&category=&script=&targetLanguage=&targetVariety=&page=&limit=` list reviewed words, contextual meanings, optional reviewed translations, pronunciations, and examples. `GET /api/vocabulary/:id` returns one reviewed entry.
- `GET /api/dictionary/search?sourceLanguage=&targetLanguage=&sourceVariety=&targetVariety=&q=&page=&limit=` searches source words and verified definitions; translations retain their context and target variety. `GET /api/dictionary/entry/:id` returns the full entry.
- `GET /api/grammar/categories`, `/api/languages/:languageId/grammar`, `/api/grammar`, `/api/grammar/:id` serve reviewed grammar content.
- `GET /api/languages/:languageId/sentences`, `/api/sentences`, `/api/sentences/:id`, `/api/sentences/exercises?language=` serve reviewed examples and sanitized exercises.
- Signed-in routes under `/api/users/learning`: `GET/POST /saved-words`, `DELETE /saved-words/:id`, `GET /vocabulary-progress`, `POST /vocabulary-progress/:vocabularyId` (`view`, `again`, `hard`, `good`, `easy`), `GET /grammar-progress`, and `POST /grammar-progress/:lessonId` (`view`, `complete`, `exercise`).
- Signed-in sentence checking uses `POST /api/sentence-practice/session` with `{exerciseId}` followed by `POST /api/sentence-practice/answer` with `{sessionId, answer}`. Answers are never included in public exercise responses.
- Reviewer/editor content routes under `/api/admin/content/:type` support list/create/update for vocabulary-categories, vocabulary, meanings, translations, sentences, grammar-categories, grammar-lessons, and sentence-exercises. New records start under review; update with `verificationStatus: "verified"`, then `status: "published"`.

Learner content requires active, verified, published records and a published language. Sentence translations are individually verified. Private learning records are scoped to the authenticated user.

Base URL: `http://localhost:5000/api`. Protected routes accept `Authorization: Bearer <token>`. Responses use consistent resource envelopes and `{ message }` errors. Public collections only return active published records, except explicitly documented legacy published languages.

| Method | Path | Access | Behavior |
|---|---|---|---|
| GET | `/health` | Public | API and MongoDB status |
| POST | `/auth/register`, `/auth/login` | Public, rate limited | Register/authenticate and return JWT |
| GET | `/auth/me` | Signed in | Current account |
| GET/PUT | `/users/profile` | Signed in | Read/update profile |
| PUT | `/users/preferences` | Signed in | Update learning modes, level, goal, interface language, and legacy language preference arrays |
| GET/PUT | `/users/languages` | Signed in | Read or update native, known, target, interface language and preferred-variety settings |
| GET | `/languages?page=&limit=&q=&region=&availability=` | Public | Paginated published language discovery |
| GET | `/languages/search?q=` | Public | Search up to 20 published languages |
| GET | `/languages/:id` | Public | Published language details, scripts, and varieties |
| GET | `/languages/:id/varieties` | Public | Published varieties for language |
| GET | `/languages/:id/scripts` | Public | Published scripts for language |
| GET | `/varieties?page=&limit=&language=` | Public | Paginated published varieties |
| GET | `/varieties/:id` | Public | Published variety detail |
| GET | `/scripts?page=&limit=` | Public | Paginated published scripts |
| GET | `/scripts/:id` | Public | Published script detail and associations |
| POST/PUT | `/languages`, `/languages/:id` | Language admin, expert, reviewer, or super admin | Create/update language; verified before publication |
| GET | `/languages/managed?page=&limit=&status=` and `/languages/managed/:id` | Language admin, expert, reviewer, or super admin | Review draft and unpublished language records |
| POST | `/languages/:id/varieties` | Language admin, expert, reviewer, or super admin | Add a variety to a language |
| POST | `/scripts` | Language admin, expert, or super admin | Add a script |
| PUT | `/scripts/:id` | Language admin, expert, or super admin | Update script, associations, verification, or publication state |
| PUT | `/varieties/:id` | Language admin, expert, reviewer, or super admin | Update variety, script associations, verification, or publication state |
| GET | `/characters/categories?language=&script=&variety=` | Public | Published, verified learning categories |
| GET | `/languages/:languageId/characters?page=&limit=&script=&variety=&category=&q=` | Public | Paginated reviewed characters for a language |
| GET | `/scripts/:scriptId/characters?page=&limit=` | Public | Paginated reviewed characters for a script |
| GET | `/characters?page=&limit=` | Public | Paginated reviewed characters |
| GET | `/characters/:id` | Public | Character details, related units, and approved pronunciations |
| GET | `/characters/:id/pronunciations` | Public | Verified pronunciation metadata and approved audio references |
| GET | `/pronunciations/:id` | Public | One published pronunciation and approved audio reference |
| GET | `/audio/:id` | Public | Stream reviewed audio only |
| POST | `/audio` | Language admin, expert, reviewer, or super admin | Upload one 10 MB maximum signature-checked audio file with consent and attribution headers; remains pending review |
| PUT | `/audio/:id/review` | Language admin, expert, reviewer, or super admin | Approve or reject consented audio |
| GET | `/audio/admin?status=pending` | Language admin, expert, reviewer, or super admin | Review audio metadata without exposing file paths |
| POST/PUT | `/admin/learning/categories`, `/admin/learning/categories/:id` | Content editor; verification requires reviewer | Create/update language-specific categories |
| GET/POST/PUT | `/admin/learning/characters`, `/admin/learning/characters/:id` | Content editor; publication requires reviewer | Manage character learning units |
| GET/POST/PUT | `/admin/learning/pronunciations`, `/admin/learning/pronunciations/:id` | Content editor; publication requires reviewer | Review/manage pronunciation data and audio associations |
| GET | `/admin/learning/revisions/:entityType/:id` | Content editor | Read the latest 50 revision snapshots |
| POST | `/practice/record` | Signed in | Record a view, writing/listening/practice event, or explicit completion |
| POST | `/practice/question` | Signed in | Create server-checked recognition, matching, or listening question |
| POST | `/practice/answer` | Signed in | Submit an answer for the learner's own pending question |
| GET | `/practice/progress?language=&script=&category=&variety=` | Signed in | Own progress and activity summary |
| GET | `/practice/progress/:languageId` | Signed in | Own progress for one language |
| PUT | `/practice/progress/:id` | Signed in | Change the caller's own learning status |

Limits are clamped (language and script catalog default 24; character default 30; progress default 50). Search inputs are bounded, and progress updates only affect the authenticated user's own records. Invalid IDs return 404. Language, variety, category, and script associations are validated server-side. For `POST /audio`, send raw audio bytes with an allowed audio `Content-Type`, `X-Recording-Consent: confirmed`, and `X-Audio-Attribution`; optional metadata headers include `X-Audio-Duration-Seconds`, `X-Speaker-Label`, and `X-Audio-Source`. The server checks the file signature and 10 MB limit. Uploads remain private/pending until review; approved playback is served through an opaque asset ID.
