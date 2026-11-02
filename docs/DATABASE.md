# Database design

## Implemented

### User

Stores display name, optional unique username, normalized unique email, bcrypt password hash (excluded by default), role, profile picture URL, verification/disable state, timestamps, and preferences. Preferences support interface language, multiple known and learning language references, proficiency, learning modes, and a daily goal.

### Language

Stores names, aliases, description, optional code, variety/script references, verification metadata and publication state. A text index covers names and aliases. Public API results only include published records. Unreviewed content is not treated as verified.

## Planned collections

LanguageVariety, Script, AlphabetCategory, Character, Phoneme, PronunciationRecording, Course, Module, Lesson, Activity, DictionaryEntry, Translation, ExampleSentence, Quiz, QuizQuestion, UserLearningLanguage, LearningProgress, VocabularyBookmark, UserRecording, Conversation, Achievement, UserXP, CommunityContribution, ContentReview, CulturalResource, Notification, ContentReport, and AdminAuditLog. Their schemas should retain source/consent, verification, provenance, and revision history where relevant.

## Modeling notes

Use ObjectId references for mutable entities and stable language/script codes where available; do not assume every language has a code, standard orthography, alphabet, or speech technology. Preserve native text as Unicode without transliteration on write. Index public lookup fields and compound user/content references; paginate large collections. Audio consent, ownership, retention, and deletion state must be explicit before accepting user recordings.
