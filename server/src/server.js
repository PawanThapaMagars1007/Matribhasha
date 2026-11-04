import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { loadEnvironment } from './config/environment.js';

let config;
try {
  config = loadEnvironment();
} catch (error) {
  console.error(JSON.stringify({ level: 'fatal', event: 'configuration_invalid', message: error.message }));
  process.exit(1);
}

const app = createApp(config);
let server;
try {
  await connectDatabase(config);
  server = app.listen(config.port, () => console.log(JSON.stringify({ level: 'info', event: 'server_started', port: config.port, environment: config.nodeEnv })));
  server.headersTimeout = 65_000;
  server.requestTimeout = 120_000;
  server.keepAliveTimeout = 5_000;
} catch (error) {
  console.error(JSON.stringify({ level: 'fatal', event: 'startup_failed', name: error.name || 'Error', code: error.code || 'STARTUP_FAILED' }));
  process.exit(1);
}

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ level: 'info', event: 'shutdown_started', signal }));
  const forceExit = setTimeout(() => process.exit(1), 15_000);
  forceExit.unref();
  try {
    if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await mongoose.disconnect();
    clearTimeout(forceExit);
    process.exit(0);
  } catch {
    clearTimeout(forceExit);
    process.exit(1);
  }
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
