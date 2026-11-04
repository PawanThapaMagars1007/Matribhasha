# Architecture

## Phase 5 learning system

`Course` contains language/variety scope, objectives, rules and ordered module references. `CourseModule` and `CourseLesson` keep language-specific sequence and reusable blocks; block references reuse the existing Character, Vocabulary, GrammarLesson, ExampleSentence, AudioAsset and Assessment models. `CourseEnrollment` and `LessonProgress` are private per user. Assessment prompts/options are separate from the `select: false` answer key; `AssessmentAttempt` is owner-scoped and stores server-computed score. `ListeningExercise` references approved AudioAsset and an assessment. `SpeakingPractice` stores self-assessment metadata only; recordings remain browser-local. `ConversationScenario` is reviewed content, while tutor conversations/messages are private. `Achievement` rules are evaluated from saved activity and `CourseCertificate` identifiers have a privacy-preserving verification read.

Lesson access requires enrollment, course/module/lesson publication and completion of prior lessons across the ordered course path. A lesson is not completed merely by opening it. Course publication, module/lesson publication, assessments and scenarios have separate review events recorded in `ContentRevision`.

## Phase 4 content and learning

Vocabulary, WordMeaning, Translation, ExampleSentence, GrammarCategory, GrammarLesson, and SentenceExercise are independent, language-scoped records. Vocabulary can have multiple contextual meanings, translations, and pronunciations. Public route filters require published status, active state, and verified metadata; parent language publication is checked. Sentence translation subrecords are filtered individually. Exercise answers use a select-false model field and owner-bound server sessions. `UserSavedWord`, `VocabularyProgress`/`VocabularyReview`, `GrammarProgress`, and `SentenceProgress` are private and keyed by user. Admin content edits create `ContentRevision` snapshots.

The application uses a React/Vite single-page client, an Express REST API, MongoDB, and Mongoose. The API owns authentication, validation, publication filtering, and role authorization. Browser sessions use HttpOnly JWT cookies, a signed CSRF token for writes, and a per-user auth version for revocation. The client uses credentialed Axios requests and follows the existing responsive design system.

## Phase 2 boundaries

- Language, variety, and script are independent Mongoose collections with references rather than a large nested catalog document.
- Published catalog reads are public; language-management writes require authentication and an allowed server-side role.
- User language preferences are scoped to the authenticated user. Native, known, target, preferred variety, and interface language remain distinct.
- The discovery page is paginated and links to a detail route. Course and alphabet learning are not represented as implemented.
- Unverified seed records remain drafts and are hidden from the public catalog.

## Phase 3 boundaries

- Character categories are configured per language, optional variety, and script. Character records can represent graphemes or other writing units without a universal alphabet taxonomy.
- Public learning endpoints expose only active, published, verified content. Reviewer-protected routes manage drafts and keep revision snapshots.
- Audio uses a storage interface with a local development adapter, signature checks, 10 MB limit, consent/attribution metadata, and reviewer approval before public playback. Replace the adapter with durable private storage for deployment.
- Freehand strokes and microphone self-practice remain local in the browser. They are not sent to the API; only activity counters and elapsed time are saved.
- Server-created quiz sessions hold correct answers and validate submitted choices. Scoring and speech recognition are not claimed.

## Phase 1 compatibility

## Phase 6 — cultural preservation and community workflows

CulturalEntry, Story, CulturalMedia, CommunitySubmission, Community, and scoped review/consent/permission records extend the existing User, Language, LanguageVariety, AudioAsset, and notification infrastructure. Culture library routes filter access before returning records. Optional bearer authentication lets anonymous users see public content while registered members can receive their approved scope. Audio routes repeat cultural access checks so an asset URL cannot bypass its linked content restrictions. Community discussions, comments, reports, reactions, follows, and moderation records use separate collections and audit entries. Audio uses private local development storage; deployments should replace it with durable private object storage. Private image/video upload storage is not configured.

Existing auth routes and user preference fields remain. The `isPublished` boolean is synchronized with language status for older records. `/api/languages` and its details routes keep their existing paths and response envelopes. Client route `/languages` remains in place.
