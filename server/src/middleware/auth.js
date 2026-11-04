import jwt from 'jsonwebtoken';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { User } from '../models/User.js';

export const SESSION_COOKIE = 'mb_session';
export const CSRF_COOKIE = 'mb_csrf';
export function parseCookies(header = '') {
  return Object.fromEntries(String(header).split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const splitAt = part.indexOf('=');
    return splitAt < 0 ? [part, ''] : [part.slice(0, splitAt), decodeURIComponent(part.slice(splitAt + 1))];
  }));
}
export function makeCsrfToken(secret) {
  const nonce = randomBytes(24).toString('base64url');
  const signature = createHmac('sha256', secret).update(nonce).digest('base64url');
  return `${nonce}.${signature}`;
}
export function verifyCsrfToken(token, secret) {
  if (typeof token !== 'string') return false;
  const [nonce, signature, extra] = token.split('.');
  if (!nonce || !signature || extra) return false;
  const expected = createHmac('sha256', secret).update(nonce).digest('base64url');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function sessionCookieOptions(production = process.env.NODE_ENV === 'production') {
  return { httpOnly: true, secure: production, sameSite: production ? 'none' : 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 };
}

function readSession(req) { return parseCookies(req.headers.cookie)[SESSION_COOKIE]; }
function verifySession(token) { return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'matribhasha-api', audience: 'matribhasha-client' }); }

export async function requireAuth(req, res, next) {
  try {
    const token = readSession(req);
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const payload = verifySession(token);
    const user = await User.findById(payload.sub).select('+authVersion');
    if (!user || user.disabledAt) return res.status(401).json({ message: 'This session is no longer available.' });
    if (!Number.isInteger(payload.av) || payload.av !== (user.authVersion || 0)) return res.status(401).json({ message: 'This session has expired. Please sign in again.' });
    req.user = user;
    next();
  } catch { return res.status(401).json({ message: 'Your session has expired. Please sign in again.' }); }
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = readSession(req);
    if (token) {
      const payload = verifySession(token);
      const user = await User.findById(payload.sub).select('+authVersion');
      if (user && !user.disabledAt && Number.isInteger(payload.av) && payload.av === (user.authVersion || 0)) req.user = user;
    }
  } catch { /* Invalid optional credentials behave as anonymous. */ }
  next();
}

export function requireRoles(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ message: 'You do not have permission to do that.' });
}
