# Environment variables

Copy `.env.example` to `server/.env` for local development. The API validates required values before it connects or listens. Never commit `.env` or place server-only values in client variables.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development`, `test`, or `production`; production behavior enables secure cross-site cookies and requires HTTPS origins |
| `PORT` | No | API listening port; defaults to `5000` |
| `MONGODB_URI` | Yes | MongoDB URI; never logged or returned |
| `MONGODB_MAX_POOL_SIZE` | No | Mongoose pool cap, 1–100; defaults to 20 |
| `JWT_SECRET` | Yes | Unique random signing secret, at least 32 characters; sample placeholders are rejected |
| `JWT_EXPIRES_IN` | No | `s`, `m`, `h`, or `d` duration; defaults to `7d` |
| `CLIENT_ORIGIN` | Yes in production | Comma-separated exact HTTP/HTTPS frontend origins; production entries must use HTTPS |
| `TRUST_PROXY_HOPS` | No | Exact trusted reverse-proxy hop count, 0–10; defaults to 0 |
| `TUTOR_API_KEY` | No | Backend-only optional AI tutor credential |
| `TUTOR_API_BASE_URL` | No | HTTPS tutor endpoint in production; defaults to the OpenAI-compatible API base |
| `TUTOR_MODEL` | No | Optional tutor model identifier |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | No | Placeholder group only; all three must be empty or set, but Cloudinary media storage is not implemented |
| `VITE_API_URL` | No, client build | Public API base URL compiled into the frontend; never put secrets here |

Generate a signing key locally with Node.js:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

The API uses secure cookies in production. The frontend origin and API must be deployed over HTTPS and configured to support credentialed CORS. Cross-site cookie behavior must be checked in the actual browser/domain arrangement before launch.
