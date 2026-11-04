const PLACEHOLDER_VALUES = new Set(['replace-with-a-long-random-secret', 'generate-a-unique-random-secret-at-least-32-characters', 'changeme', 'change-me', 'secret', 'development-secret']);

export function loadEnvironment(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) throw new Error('NODE_ENV must be development, test, or production.');

  const mongoUri = String(env.MONGODB_URI || '').trim();
  if (!/^mongodb(?:\+srv)?:\/\//i.test(mongoUri)) throw new Error('MONGODB_URI must be set to a MongoDB connection URI.');

  const jwtSecret = String(env.JWT_SECRET || '');
  if (jwtSecret.length < 32 || PLACEHOLDER_VALUES.has(jwtSecret.toLowerCase())) throw new Error('JWT_SECRET must be a unique random value of at least 32 characters.');

  const port = Number(env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
  const maxPoolSize = Number(env.MONGODB_MAX_POOL_SIZE || 20);
  if (!Number.isInteger(maxPoolSize) || maxPoolSize < 1 || maxPoolSize > 100) throw new Error('MONGODB_MAX_POOL_SIZE must be an integer from 1 to 100.');
  const proxyHops = Number(env.TRUST_PROXY_HOPS || 0);
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 10) throw new Error('TRUST_PROXY_HOPS must be an integer from 0 to 10.');

  const origins = String(env.CLIENT_ORIGIN || (nodeEnv === 'production' ? '' : 'http://localhost:5173'))
    .split(',').map((value) => value.trim()).filter(Boolean);
  if (!origins.length) throw new Error('CLIENT_ORIGIN must list at least one allowed frontend origin.');
  for (const origin of origins) {
    let parsed;
    try { parsed = new URL(origin); } catch { throw new Error('CLIENT_ORIGIN must contain valid origin URLs.'); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin.replace(/\/$/, '')) throw new Error('CLIENT_ORIGIN entries must be exact HTTP or HTTPS origins without paths.');
    if (nodeEnv === 'production' && parsed.protocol !== 'https:') throw new Error('Production CLIENT_ORIGIN entries must use HTTPS.');
  }

  const expiresIn = env.JWT_EXPIRES_IN || '7d';
  if (!/^\d+(s|m|h|d)$/.test(expiresIn)) throw new Error('JWT_EXPIRES_IN must use seconds, minutes, hours, or days (for example 7d).');
  const tutorBaseUrl = env.TUTOR_API_BASE_URL || 'https://api.openai.com/v1';
  try {
    const tutorUrl = new URL(tutorBaseUrl);
    if (tutorUrl.protocol !== 'https:' && !(nodeEnv !== 'production' && ['localhost', '127.0.0.1'].includes(tutorUrl.hostname))) throw new Error();
  } catch { throw new Error('TUTOR_API_BASE_URL must be an HTTPS URL (localhost is allowed outside production).'); }

  const cloudinaryValues = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].map((key) => Boolean(env[key]));
  if (cloudinaryValues.some(Boolean) && !cloudinaryValues.every(Boolean)) throw new Error('Configure all Cloudinary variables together or leave them all empty.');

  return Object.freeze({ nodeEnv, mongoUri, jwtSecret, jwtExpiresIn: expiresIn, port, clientOrigins: origins.map((origin) => new URL(origin).origin), maxPoolSize, proxyHops, tutorApiBaseUrl: tutorBaseUrl, tutorApiKey: env.TUTOR_API_KEY || '', tutorModel: env.TUTOR_MODEL || 'gpt-4o-mini' });
}
