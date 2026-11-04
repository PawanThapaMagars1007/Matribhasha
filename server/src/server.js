import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import languageRoutes from './routes/languages.js';
import varietyRoutes from './routes/varieties.js';
import scriptRoutes from './routes/scripts.js';
import characterRoutes from './routes/characters.js';
import practiceRoutes from './routes/practice.js';
import adminLearningRoutes from './routes/adminLearning.js';
import audioRoutes from './routes/audio.js';
import vocabularyRoutes from './routes/vocabulary.js';
import grammarRoutes from './routes/grammar.js';
import sentencePracticeRoutes from './routes/sentencePractice.js';
import userLearningRoutes from './routes/userLearning.js';
import dictionaryRoutes from './routes/dictionary.js';
import adminContentRoutes from './routes/adminContent.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((value) => value.trim()), credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/varieties', varietyRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api', characterRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/admin/learning', adminLearningRoutes);
app.use('/api/admin/content', adminContentRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/users/learning', userLearningRoutes);
app.use('/api/sentence-practice', sentencePracticeRoutes);
app.use('/api', vocabularyRoutes);
app.use('/api', dictionaryRoutes);
app.use('/api', grammarRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);
try {
  if (process.env.MONGODB_URI) await connectDatabase();
  else console.warn('MONGODB_URI is not configured; database features will be unavailable.');
  app.listen(port, () => console.log(`Matribhasha API listening on port ${port}`));
} catch (error) {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
}
