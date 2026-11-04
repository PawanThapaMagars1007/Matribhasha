# Database design — Phase 2

## Phase 5 collections

- `Course` → language, optional variety, prerequisites, modules, configured assessments and completion rules.
- `CourseModule` → course and ordered `CourseLesson` references. `CourseLesson` stores ordered content blocks referencing Phase 3–4 records.
- `CourseEnrollment` → unique user/course; `LessonProgress` → unique user/lesson with completion and saved state.
- `Assessment` → public prompts/options and a select-false `answerKey`; `AssessmentAttempt` → private user answers and server-computed result. `ListeningExercise` ties approved audio to a listening assessment.
- `SpeakingPractice` stores target and self-rating, never microphone bytes. `ConversationScenario` is reviewable; `TutorConversation` and `TutorMessage` are private to their owner.
- `Achievement` stores configurable criteria; `UserAchievement` is unique per user/rule. `CourseCertificate` is unique per user/course and has an opaque verification identifier.

Indexes cover language discovery, course sequence, user/course enrolment, user/lesson progress, assessment attempts, private conversation history, and unique achievement/certificate ownership.

## Phase 4 collections

`VocabularyCategory`, `Vocabulary`, `WordMeaning`, `Translation`, `ExampleSentence`, `GrammarCategory`, `GrammarLesson`, and `SentenceExercise` hold reviewed content. Vocabulary pronunciations share `Pronunciation` with Phase 3 via mutually exclusive `character` or `vocabulary` references. `UserSavedWord`, `VocabularyProgress`, `VocabularyReview`, `GrammarProgress`, `SentencePracticeSession`, and `SentenceProgress` hold learner-private state. Exercise answers are hidden from ordinary model selection and copied only to owner-bound practice sessions.

MongoDB stores independently managed languages, varieties, and writing systems. All records use Mongoose timestamps, explicit publication state, an active flag, and verification metadata where linguistic claims are made.

## Collections and relationships

- **User** keeps account and Phase 1 preferences. `nativeLanguages`, `knownLanguages`, and `learningLanguages` are separate arrays of `Language` references. `interfaceLanguage` remains independent. `preferredVarieties` stores a language/variety pair and is validated against the variety's parent language when saved.
- **Language** holds names, aliases, description, optional ISO code, region tags, an optional reviewed family claim, availability, resources, provenance, publication state, and references to scripts and varieties. Language records are not oversized course documents; learning modules can reference the language later.
- **LanguageVariety** belongs to one parent language, has its own names, regions, aliases, availability, scripts, provenance, and publication state. Boundaries need not imply standardization.
- **Script** is independent from languages and varieties. Its language and variety associations are references, so one script can serve multiple languages and one language can use multiple scripts. Direction, Unicode range, font requirements, and verification are optional.

```text
User.preferences ──< known/native/learning ──> Language
User.preferences ──< preferredVarieties ──> (Language, LanguageVariety)
Language ──< LanguageVariety
Language >──< Script
LanguageVariety >──< Script
```

## Validation and indexes

Language names and variety names are required. Nonempty language codes are unique; the code field is optional because not every record has a verified code. Variety names are unique within a parent language; script names are unique. Search indexes cover language names and aliases. Compound publication and parent indexes support catalog queries. Public endpoints require active, published records. Legacy Phase 1 `isPublished` records remain readable; writing status synchronizes that compatibility field.

Unreviewed records may be prepared as drafts, but publishing a language or script requires verified status. Never fill family, code, native name, or script associations from guesswork. Preserve Unicode exactly as submitted.

## Development seed

`server/src/seed/languages.js` exports a small draft-only seed set. It adds no native names, codes, families, or script associations; its explicit development provenance requires expert verification. Seed records are not visible through public catalog endpoints. Run `npm run seed --prefix server` with a configured MongoDB URI. The script is idempotent by language name.

## Phase 3 learning collections

- **CharacterCategory** belongs to a language and script and optionally one variety. Category names and order are configurable for each writing system; no universal alphabet taxonomy is assumed.
- **Character** represents a grapheme or other orthographic learning unit. It references a language, one script, an optional variety and category, and carries contextual notes, examples, and optional transliteration. It does not conflate a character with a phoneme.
- **Pronunciation** references a character, language and optional variety. It stores notation separately from audio and records source, attribution, speaker label, and review state.
- **AudioAsset** stores metadata and a generated storage key for a locally stored, signature-checked audio file. Consent and attribution are required for upload. Audio is served only after review and publication.
- **LearningProgress** is unique per user and character. It counts views, writing/listening/quiz activities, answers and learning time; status advances only through practice or an explicit completion action.
- **PracticeSession** is user-owned and stores answer choices and the correct answer server-side so answer submissions are checked by the API.
- **ContentRevision** snapshots category, character, and pronunciation records before edits, with actor and timestamp.

```text
Language ──< CharacterCategory >── Script
Language ──< Character >── Script
             │             └── optional LanguageVariety
             ├── optional CharacterCategory
             └──< Pronunciation >── AudioAsset
User ──< LearningProgress >── Character
User ──< PracticeSession
```

Character categories, characters, pronunciations, and audio remain drafts or under review until an authorized expert verifies and publishes them. Public character queries only return active, published, verified content; attached audio must also be consented, verified, and published. The local file adapter is suitable for development; deployments should replace it with durable private object storage while preserving this interface.

Writing strokes and self-recordings stay in the browser. They are not uploaded or saved as media. The API stores only the learner's activity counts and elapsed time.

## Phase 6 cultural and community records

`Community` scopes membership, guidelines, and language/variety associations. `CommunityMembership` tracks requests and approved roles. `CulturalEntry`, `Story`, and `CulturalMedia` reference the existing `Language`, `LanguageVariety`, and `User` records; story/media links support audio-only narratives and multiple story versions. `CommunitySubmission` preserves contributor intake and points to the cultural target. `ConsentRecord` stores grantor, content, scope, status, expiry, and recorder; `ContentPermission` grants scoped researcher or restricted access. `ContentReview` keeps linguistic, cultural, permission, and source decisions separate. `ContentRevision` retains snapshots. `ContributorProfile` controls public identity display. `Discussion`, `Comment`, `DiscussionReaction`, `ContentReport`, `ModerationAction`, `CommunityFollow`, `Notification`, `WithdrawalRequest`, and `ContentAccessLog` support the associated workflows and audits. Cultural content uses indexes on status, language, variety, community, access level, and text-search fields; membership, permissions, consent, and reports have compound lookup indexes.
