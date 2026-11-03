# Architecture

The application uses a React/Vite single-page client, an Express REST API, MongoDB, and Mongoose. The API owns authentication, validation, publication filtering, and role authorization. The client uses Axios and bearer JWTs and follows the existing responsive design system.

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

Existing auth routes and user preference fields remain. The `isPublished` boolean is synchronized with language status for older records. `/api/languages` and its details routes keep their existing paths and response envelopes. Client route `/languages` remains in place.
