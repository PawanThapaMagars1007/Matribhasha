import mongoose from 'mongoose';

export async function connectDatabase(config) {
  if (!config?.mongoUri) throw new Error('Validated MongoDB configuration is required.');
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000, maxPoolSize: config.maxPoolSize, minPoolSize: 0, retryWrites: true });
  console.log(JSON.stringify({ level: 'info', event: 'database_connected', database: mongoose.connection.name }));
  mongoose.connection.on('disconnected', () => console.warn(JSON.stringify({ level: 'warn', event: 'database_disconnected' })));
  mongoose.connection.on('reconnected', () => console.log(JSON.stringify({ level: 'info', event: 'database_reconnected' })));
}
