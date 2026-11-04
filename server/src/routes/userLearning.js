import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { Vocabulary } from '../models/Vocabulary.js';
import { UserSavedWord } from '../models/UserSavedWord.js';
import { VocabularyProgress } from '../models/VocabularyProgress.js';
import { VocabularyReview } from '../models/VocabularyReview.js';
import { GrammarLesson } from '../models/GrammarLesson.js';
import { GrammarProgress } from '../models/GrammarProgress.js';
import { scheduleReview, defaultReviewConfig } from '../services/spacedRepetition.js';
import { award } from './courses.js';

const router = Router();
const live = { status: 'published', isActive: true, 'verification.status': 'verified' };
router.use(requireAuth);

router.get('/saved-words', async (req, res, next) => { try { const rows = await UserSavedWord.find({ user: req.user._id }).populate({ path: 'vocabulary', match: live, select: 'nativeForm romanTransliteration language variety' }).sort({ updatedAt: -1 }).lean(); return res.json({ savedWords: rows.filter((row) => row.vocabulary) }); } catch (e) { return next(e); } });
router.post('/saved-words', async (req, res, next) => {
  try {
    const p = z.object({ vocabularyId: z.string().regex(/^[a-f\d]{24}$/i), listName: z.string().trim().max(80).optional(), personalNote: z.string().trim().max(1000).optional() }).strict().safeParse(req.body);
    if (!p.success) return res.status(400).json({ message: 'Check the saved word details.' });
    const word = await Vocabulary.findOne({ _id: p.data.vocabularyId, ...live }).select('language variety').lean(); if (!word) return res.status(404).json({ message: 'Word not found.' });
    const savedWord = await UserSavedWord.findOneAndUpdate({ user: req.user._id, vocabulary: word._id }, { $set: { language: word.language, variety: word.variety, ...(p.data.listName !== undefined ? { listName: p.data.listName } : {}), ...(p.data.personalNote !== undefined ? { personalNote: p.data.personalNote } : {}) }, $setOnInsert: { user: req.user._id } }, { upsert: true, new: true });
    return res.status(201).json({ savedWord });
  } catch (e) { return next(e); }
});
router.delete('/saved-words/:id', async (req, res, next) => { try { if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Saved word not found.' }); const row = await UserSavedWord.findOneAndDelete({ _id: req.params.id, user: req.user._id }); return row ? res.json({ deleted: true }) : res.status(404).json({ message: 'Saved word not found.' }); } catch (e) { return next(e); } });

router.get('/vocabulary-progress', async (req, res, next) => { try { const rows = await VocabularyProgress.find({ user: req.user._id }).populate({ path: 'vocabulary', match: live, select: 'nativeForm romanTransliteration language variety' }).sort({ nextReviewAt: 1 }).lean(); return res.json({ progress: rows.filter((row) => row.vocabulary) }); } catch (e) { return next(e); } });
router.post('/vocabulary-progress/:vocabularyId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.vocabularyId)) return res.status(404).json({ message: 'Word not found.' });
    const p = z.object({ action: z.enum(['view', 'again', 'hard', 'good', 'easy']) }).strict().safeParse(req.body); if (!p.success) return res.status(400).json({ message: 'Choose a valid review action.' });
    const word = await Vocabulary.findOne({ _id: req.params.vocabularyId, ...live }).select('language variety category').lean(); if (!word) return res.status(404).json({ message: 'Word not found.' });
    let progress = await VocabularyProgress.findOneAndUpdate({ user: req.user._id, vocabulary: word._id }, { $setOnInsert: { language: word.language, variety: word.variety, category: word.category }, $inc: { viewCount: p.data.action === 'view' ? 1 : 0, flashcardsCompleted: p.data.action === 'view' ? 0 : 1 }, ...(p.data.action === 'view' ? { $set: { lastReviewedAt: new Date() } } : {}) }, { upsert: true, new: true, setDefaultsOnInsert: true });
    if (p.data.action !== 'view') {
      const rating = p.data.action, prior = progress.toObject(), schedule = scheduleReview(rating, prior, new Date(), defaultReviewConfig(process.env));
      progress = await VocabularyProgress.findOneAndUpdate({ user: req.user._id, vocabulary: word._id }, { $set: { status: schedule.status, repetitions: schedule.repetitions, intervalDays: schedule.intervalDays, nextReviewAt: schedule.nextReviewAt, lastReviewedAt: new Date() } }, { new: true });
      await VocabularyReview.create({ user: req.user._id, vocabulary: word._id, rating, previousIntervalDays: prior.intervalDays, nextIntervalDays: schedule.intervalDays, nextReviewAt: schedule.nextReviewAt });
      await award(req.user._id, 'vocabulary-review');
      await UserSavedWord.findOneAndUpdate({ user: req.user._id, vocabulary: word._id }, { $set: { lastStudiedAt: new Date(), needsRevision: rating === 'again' } });
    }
    return res.json({ progress });
  } catch (e) { return next(e); }
});
router.get('/grammar-progress', async (req, res, next) => { try { const rows = await GrammarProgress.find({ user: req.user._id }).populate({ path: 'lesson', match: live, select: 'title nativeTitle language variety difficulty' }).sort({ lastStudiedAt: -1 }).lean(); return res.json({ progress: rows.filter((row) => row.lesson) }); } catch (e) { return next(e); } });
router.post('/grammar-progress/:lessonId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.lessonId)) return res.status(404).json({ message: 'Lesson not found.' });
    const p = z.object({ action: z.enum(['view', 'complete', 'exercise']), correct: z.boolean().optional(), seconds: z.number().int().min(0).max(3600).optional() }).strict().safeParse(req.body); if (!p.success) return res.status(400).json({ message: 'Check the lesson progress action.' });
    const lesson = await GrammarLesson.findOne({ _id: req.params.lessonId, ...live }).select('language variety').lean(); if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });
    const action = p.data.action;
    const progress = await GrammarProgress.findOneAndUpdate({ user: req.user._id, lesson: lesson._id }, { $set: { language: lesson.language, variety: lesson.variety, lastStudiedAt: new Date(), ...(action === 'complete' ? { status: 'completed' } : action === 'view' ? { status: 'learning' } : {}) }, $setOnInsert: { user: req.user._id }, $inc: { viewCount: action === 'view' ? 1 : 0, exerciseAttempts: action === 'exercise' ? 1 : 0, correctAnswers: action === 'exercise' && p.data.correct ? 1 : 0, learningTimeSeconds: p.data.seconds || 0 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.json({ progress });
  } catch (e) { return next(e); }
});
export default router;
