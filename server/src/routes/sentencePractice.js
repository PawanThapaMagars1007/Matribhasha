import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { SentenceExercise } from '../models/SentenceExercise.js';
import { SentencePracticeSession } from '../models/SentencePracticeSession.js';
import { SentenceProgress } from '../models/SentenceProgress.js';
import { Language } from '../models/Language.js';

const router = Router();
const live = { status: 'published', isActive: true, 'verification.status': 'verified' };
const languageLive = { $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] };
router.use(requireAuth);

router.post('/session', async (req, res, next) => {
  try {
    const parsed = z.object({ exerciseId: z.string().regex(/^[a-f\d]{24}$/i) }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Choose a valid sentence exercise.' });
    const exercise = await SentenceExercise.findOne({ _id: parsed.data.exerciseId, ...live }).select('+answer').lean();
    if (!exercise || !(await Language.exists({ _id: exercise.language, ...languageLive }))) return res.status(404).json({ message: 'Sentence exercise not found.' });
    const accepted = exercise.type === 'word-order' ? (exercise.tokens || []).map((token) => token.id) : (exercise.choices || []).map((choice) => choice.id);
    const session = await SentencePracticeSession.create({ user: req.user._id, exercise: exercise._id, language: exercise.language, variety: exercise.variety, choices: accepted, answer: exercise.answer });
    const prompt = { id: exercise._id, type: exercise.type, prompt: exercise.prompt, instructions: exercise.instructions, difficulty: exercise.difficulty };
    if (exercise.type === 'word-order') prompt.tokens = exercise.tokens.map(({ id, text }) => ({ id, text }));
    else prompt.choices = exercise.choices.map(({ id, label }) => ({ id, label }));
    return res.status(201).json({ sessionId: session._id, exercise: prompt });
  } catch (error) { return next(error); }
});
router.post('/answer', async (req, res, next) => {
  try {
    const parsed = z.object({ sessionId: z.string().regex(/^[a-f\d]{24}$/i), answer: z.union([z.string().max(2000), z.array(z.string().max(100)).max(100)]) }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Submit a valid answer.' });
    const session = await SentencePracticeSession.findOne({ _id: parsed.data.sessionId, user: req.user._id, status: 'pending' });
    if (!session) return res.status(404).json({ message: 'Practice session is unavailable or already answered.' });
    const ids = Array.isArray(parsed.data.answer) ? parsed.data.answer : [parsed.data.answer];
    if (ids.some((id) => !session.choices.includes(id))) return res.status(400).json({ message: 'Answer contains an unknown choice.' });
    const exercise = await SentenceExercise.findOne({ _id: session.exercise, ...live }).select('+answer').lean();
    if (!exercise) return res.status(404).json({ message: 'Sentence exercise is no longer available.' });
    const correct = JSON.stringify(exercise.answer) === JSON.stringify(parsed.data.answer);
    const updated = await SentencePracticeSession.findOneAndUpdate({ _id: session._id, user: req.user._id, status: 'pending' }, { $set: { submittedAnswer: parsed.data.answer, isCorrect: correct, status: 'answered', answeredAt: new Date() } }, { new: true });
    if (!updated) return res.status(409).json({ message: 'This session was already answered.' });
    await SentenceProgress.findOneAndUpdate({ user: req.user._id, exercise: exercise._id }, { $set: { language: exercise.language, variety: exercise.variety, lastPractisedAt: new Date(), ...(correct ? { completed: true } : {}) }, $setOnInsert: { user: req.user._id }, $inc: { attempts: 1, correctAnswers: correct ? 1 : 0 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.json({ correct, explanation: correct ? exercise.explanation : '', completed: correct });
  } catch (error) { return next(error); }
});
router.get('/progress', async (req, res, next) => {
  try { const progress = await SentenceProgress.find({ user: req.user._id }).populate({ path: 'exercise', match: live, select: 'prompt type difficulty' }).sort({ lastPractisedAt: -1 }).lean(); return res.json({ progress: progress.filter((row) => row.exercise) }); }
  catch (error) { return next(error); }
});
export default router;
