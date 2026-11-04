import { randomUUID } from 'node:crypto';
import { CSRF_COOKIE, SESSION_COOKIE, parseCookies, verifyCsrfToken } from './auth.js';

export function requestContext(req, res, next) {
  const requestId = randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(JSON.stringify({ level: 'info', event: 'http_request', requestId, method: req.method, path: req.path, status: res.statusCode, durationMs: Math.round(durationMs * 100) / 100 }));
  });
  next();
}

export function rejectStructuredQueryValues(req, res, next) {
  for (const value of Object.values(req.query || {})) {
    if (value !== null && typeof value === 'object') return res.status(400).json({ message: 'Query parameters must be supplied once as simple values.', requestId: req.requestId });
  }
  next();
}

export function rejectUnsafeBodyKeys(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Buffer.isBuffer(req.body)) return next();
  const pending = [req.body];
  while (pending.length) {
    const value = pending.pop();
    if (!value || typeof value !== 'object') continue;
    for (const [key, child] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.') || ['__proto__', 'prototype', 'constructor'].includes(key)) return res.status(400).json({ message: 'Request contains an unsupported field name.', requestId: req.requestId });
      if (child && typeof child === 'object') pending.push(child);
    }
  }
  next();
}

export function csrfProtection(config) {
  const mutating = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  return (req, res, next) => {
    if (!mutating.has(req.method)) return next();
    const origin = req.get('origin');
    if (origin && !config.clientOrigins.includes(origin)) return res.status(403).json({ message: 'Request origin is not allowed.', requestId: req.requestId });
    let cookies;
    try { cookies = parseCookies(req.headers.cookie); } catch { return res.status(403).json({ message: 'Request security token is invalid.', requestId: req.requestId }); }
    if (cookies[SESSION_COOKIE]) {
      const csrfCookie = cookies[CSRF_COOKIE];
      const csrfHeader = req.get('x-csrf-token');
      if ((origin && !config.clientOrigins.includes(origin)) || !csrfCookie || csrfCookie !== csrfHeader || !verifyCsrfToken(csrfCookie, config.jwtSecret)) return res.status(403).json({ message: 'Request verification failed. Refresh the page and try again.', requestId: req.requestId });
    }
    next();
  };
}
