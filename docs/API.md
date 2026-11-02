# API

Base URL: `http://localhost:5000/api`. JSON responses use `{ message }`, `{ user }`, `{ languages, pagination }`, or `{ language }` envelopes. Protected endpoints accept `Authorization: Bearer <token>`.

| Method | Path | Access | Current behavior |
|---|---|---|---|
| GET | `/health` | Public | API and MongoDB status |
| POST | `/auth/register` | Public, rate-limited | Create learner and return JWT |
| POST | `/auth/login` | Public, rate-limited | Authenticate and return JWT |
| POST | `/auth/logout` | Public | Client session sign-out acknowledgement |
| POST | `/auth/refresh` | Public | Returns 501 until refresh-token rotation is implemented |
| POST | `/auth/forgot-password` | Public | Generic response; email delivery is not configured |
| POST | `/auth/reset-password` | Public | Returns 501 until reset tokens and email delivery are implemented |
| GET | `/auth/me` | Learner | Return current account |
| GET/PUT | `/users/profile` | Learner | Read/update profile fields |
| PUT | `/users/preferences` | Learner | Update validated learning preferences |
| GET | `/languages?page=&limit=&q=` | Public | Search published language records |
| GET | `/languages/:id` | Public | Read a published language |
| GET | `/languages/:id/varieties` | Public | Empty until Phase 2 |
| GET | `/languages/:id/scripts` | Public | Empty until Phase 2 |

Public language listing is paginated (default 24, maximum 50). Authentication uses bearer JWTs; role middleware is available for upcoming admin routes.
