# API

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

Limits are clamped to 1–50 (default 24), search input is bounded, and user updates only affect the authenticated user's own record. Invalid IDs return 404. Language and variety associations are validated server-side.
