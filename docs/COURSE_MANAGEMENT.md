# Course management

## Structure

A course belongs to a published Language and may target one published LanguageVariety. CourseModule and CourseLesson order is configured by the course author; no universal alphabet or lesson sequence is assumed. Lesson blocks can reference existing verified Character, Vocabulary, GrammarLesson, ExampleSentence, AudioAsset, ListeningExercise, and Assessment records.

## Contributor and reviewer workflow

Users with `superAdmin`, `languageAdmin`, `languageExpert`, or `reviewer` roles can create course drafts under `/api/admin/courses`, then add modules, lessons, assessments, listening activities, and conversation scenarios using the API routes listed in `API.md`. New material starts `under-review` and pending. Reviewers publish individual modules/lessons and finally the course using `PUT /api/admin/content/{courses|modules|lessons|assessments|listening|conversations}/:id/review` with `{ "status": "published" }`. Each review saves a ContentRevision snapshot. Existing linguistic records must already be verified and published before a lesson can reference them. Lesson image blocks accept secure `https://` URLs only.

Assessment creation keeps the answer key in a select-false field. Pass question identifiers and an `answerKey` mapping in the protected create request; never expose that mapping in learner clients. Listening assessments must use approved, consent-recorded AudioAsset. Scenarios are language/variety-specific and remain unpublished until human review.

The current learner UI supports course discovery, enrolment, sequential reading lessons, text lesson creation, assessments, listening and practice. More advanced block editing and full assessment authoring controls can be added as the authoring workflow grows; the APIs support structured blocks and question data.
