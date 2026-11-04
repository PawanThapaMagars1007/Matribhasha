import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEnvironment } from '../src/config/environment.js';
import { makeCsrfToken, verifyCsrfToken, parseCookies, sessionCookieOptions } from '../src/middleware/auth.js';
import { csrfProtection, rejectStructuredQueryValues, rejectUnsafeBodyKeys, requestContext } from '../src/middleware/requestSecurity.js';

const valid = { NODE_ENV: 'test', MONGODB_URI: 'mongodb://127.0.0.1:27017/matribhasha_test', JWT_SECRET: 'a-unique-test-secret-with-at-least-32-characters', CLIENT_ORIGIN: 'http://localhost:5173' };

test('startup configuration requires database and non-placeholder signing secrets', () => {
  assert.throws(() => loadEnvironment({ ...valid, MONGODB_URI: '' }), /MONGODB_URI/);
  assert.throws(() => loadEnvironment({ ...valid, JWT_SECRET: 'replace-with-a-long-random-secret' }), /JWT_SECRET/);
  assert.throws(() => loadEnvironment({ ...valid, JWT_SECRET: 'too-short' }), /JWT_SECRET/);
  assert.equal(loadEnvironment(valid).maxPoolSize, 20);
});

test('production origins require HTTPS and normalize to exact origins', () => {
  assert.throws(() => loadEnvironment({ ...valid, NODE_ENV: 'production', CLIENT_ORIGIN: 'http://matribhasha.example' }), /HTTPS/);
  const config = loadEnvironment({ ...valid, CLIENT_ORIGIN: 'http://localhost:5173/' });
  assert.deepEqual(config.clientOrigins, ['http://localhost:5173']);
});

test('CSRF tokens are signed, cookie parsing is bounded to pairs, and session cookies are HttpOnly', () => {
  const token = makeCsrfToken(valid.JWT_SECRET);
  assert.equal(verifyCsrfToken(token, valid.JWT_SECRET), true);
  assert.equal(verifyCsrfToken(`${token}x`, valid.JWT_SECRET), false);
  assert.equal(verifyCsrfToken(token, 'different-secret'), false);
  assert.deepEqual(parseCookies('mb_session=abc; mb_csrf=one.two'), { mb_session: 'abc', mb_csrf: 'one.two' });
  assert.equal(sessionCookieOptions(true).httpOnly, true);
  assert.equal(sessionCookieOptions(true).secure, true);
});

test('request middleware rejects ambiguous queries, Mongo operators, and foreign origins', async () => {
  const response = { code: 200, body: null, headers: {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, setHeader(name, value) { this.headers[name] = value; }, on() {} };
  const invoke = (middleware, req) => { let passed = false; middleware(req, response, () => { passed = true; }); return passed; };
  const duplicateQuery = invoke(rejectStructuredQueryValues, { query: { page: ['1', '2'] }, requestId: 'test' });
  assert.equal(duplicateQuery, false);
  assert.equal(response.code, 400);
  const operator = invoke(rejectUnsafeBodyKeys, { body: { password: { $gt: '' } }, requestId: 'test' });
  assert.equal(operator, false);
  assert.equal(response.code, 400);
  const config = loadEnvironment(valid);
  const forbiddenOrigin = invoke(csrfProtection(config), { method: 'POST', headers: {}, get: () => 'https://untrusted.example', requestId: 'test' });
  assert.equal(forbiddenOrigin, false);
  assert.equal(response.code, 403);
  await invoke(requestContext, { method: 'GET', path: '/health' });
  assert.match(response.headers['X-Request-Id'], /^[0-9a-f-]{36}$/i);
});
