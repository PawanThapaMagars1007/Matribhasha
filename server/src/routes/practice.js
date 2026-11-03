import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { Character } from '../models/Character.js';
import { CharacterCategory } from '../models/CharacterCategory.js';
import { Language } from '../models/Language.js';
import { Script } from '../models/Script.js';
import { Pronunciation } from '../models/Pronunciation.js';
import { AudioAsset } from '../models/AudioAsset.js';
import { LearningProgress } from '../models/LearningProgress.js';
import { PracticeSession } from '../models/PracticeSession.js';

const router = Router();
router.use(requireAuth);
const live = { status: 'published', isActive: true, 'verification.status': 'verified' };
const idSchema = z.string().regex(/^[a-f\d]{24}$/i);

router.post('/record', async (req, res, next) => {
  try {
    const parsed = z.object({ characterId: idSchema, action: z.enum(['view', 'practice', 'writing', 'listening', 'completed']), durationSeconds: z.number().int().min(0).max(1800).optional() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Please check the practice activity.' });
    const character = await Character.findOne({ _id: parsed.data.characterId, ...live });
    if (!character) return res.status(404).json({ message: 'Learning character not found.' });
    const prior = await LearningProgress.findOne({ user: req.user._id, character: character._id }).select('status');
    const increment = {};
    const action = parsed.data.action;
    if (action === 'view') increment.viewedCount = 1;
    if (action === 'practice') increment.practiceCount = 1;
    if (action === 'writing') { increment.practiceCount = 1; increment.writingExercises = 1; }
    if (action === 'listening') { increment.practiceCount = 1; increment.listeningExercises = 1; }
    if (parsed.data.durationSeconds) increment.learningTimeSeconds = parsed.data.durationSeconds;
    const status = action === 'completed' ? 'completed' : action === 'writing' || action === 'listening' ? (prior?.status === 'completed' ? 'completed' : 'practised') : action === 'practice' ? (prior?.status === 'completed' ? 'completed' : 'learning') : undefined;
    const update = { $setOnInsert: { user: req.user._id, character: character._id, language: character.language, variety: character.variety, script: character.script, category: character.category, status: 'not-started' }, $set: { lastPracticeAt: new Date() } };
    if (Object.keys(increment).length) update.$inc = increment;
    if (status) update.$set.status = status;
    const progress = await LearningProgress.findOneAndUpdate({ user: req.user._id, character: character._id }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.json({ progress });
  } catch (error) { return next(error); }
});

router.post('/question', async (req, res, next) => {
  try {
    const parsed = z.object({ languageId: idSchema, scriptId: idSchema, varietyId: idSchema.optional(), categoryId: idSchema.optional(), mode: z.enum(['recognition', 'matching', 'listening']) }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Select a language, writing system, and practice mode.' });
    const { languageId, scriptId, varietyId, categoryId, mode } = parsed.data;
    const language = await Language.findOne({ _id: languageId, $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] }).select('_id').lean();
    const script = await Script.findOne({ _id: scriptId, status: 'published', isActive: true, languages: languageId }).select('_id').lean();
    if (!language || !script) return res.status(404).json({ message: 'Published language or writing system not found.' });
    const filter = { language: languageId, script: scriptId, ...live };
    filter.variety = varietyId || null;
    if (categoryId) filter.category = categoryId;
    let candidates = await Character.find(filter).select('grapheme displayForm name language variety script category').limit(150).lean();
    if (mode === 'listening') {
      const ids = candidates.map((item) => item._id);
      const recordings = await Pronunciation.find({ character: { $in: ids }, ...live, audioAsset: { $ne: null } }).populate({ path: 'audioAsset', match: { status: 'published', 'verification.status': 'verified', consentRecorded: true }, select: 'status verification.status' }).lean();
      const eligible = [...new Map(recordings.filter((item) => item.audioAsset).map((item) => [String(item.character), String(item.audioAsset._id)])).entries()].map(([characterId, audioAssetId]) => ({ characterId, audioAssetId }));
      candidates = eligible.map((entry) => candidates.find((item) => String(item._id) === entry.characterId)).filter(Boolean);
      if (candidates.length < 4) return res.status(404).json({ message: 'Listening practice needs at least four approved characters with recordings.' });
      candidates = shuffle(candidates);
      const target = candidates[0]; const recording = recordings.find((item) => String(item.character) === String(target._id) && item.audioAsset);
      const choices = shuffle([target, ...candidates.filter((item) => String(item._id) !== String(target._id)).slice(0, 3)]);
      const session = await PracticeSession.create({ user: req.user._id, language: languageId, script: scriptId, variety: varietyId || null, category: categoryId || null, mode, targetCharacter: target._id, correctCharacter: target._id, choices: choices.map((item) => item._id), audioUrl: `/api/audio/${recording.audioAsset._id}` });
      return res.status(201).json({ sessionId: session._id, mode, audioUrl: session.audioUrl, choices: choices.map(characterChoice) });
    }
    candidates = uniqueLabels(candidates.filter((item) => item.name || item.nativeName || item.transliteration));
    if (candidates.length < 4) return res.status(404).json({ message: 'Recognition practice needs at least four approved characters.' });
    candidates = shuffle(candidates); const target = candidates[0]; const choices = shuffle([target, ...candidates.filter((item) => String(item._id) !== String(target._id)).slice(0, 3)]);
    const session = await PracticeSession.create({ user: req.user._id, language: languageId, script: scriptId, variety: varietyId || null, category: categoryId || null, mode, targetCharacter: target._id, correctCharacter: target._id, choices: choices.map((item) => item._id) });
    const prompt = mode === 'matching' ? { label: target.name || target.nativeName || target.transliteration } : characterChoice(target);
    const optionList = mode === 'matching' ? choices.map(characterChoice) : choices.map((item) => ({ _id: String(item._id), label: item.name || item.nativeName || item.transliteration }));
    return res.status(201).json({ sessionId: session._id, mode, prompt, choices: optionList });
  } catch (error) { return next(error); }
});

router.post('/answer', async (req, res, next) => {
  try {
    const parsed = z.object({ sessionId: idSchema, selectedCharacterId: idSchema }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Choose one of the answer options.' });
    const session = await PracticeSession.findOne({ _id: parsed.data.sessionId, user: req.user._id, status: 'pending' });
    if (!session) return res.status(404).json({ message: 'Practice question not found or already answered.' });
    if (!session.choices.some((item) => String(item) === parsed.data.selectedCharacterId)) return res.status(400).json({ message: 'That answer is not part of this question.' });
    const isCorrect = String(session.correctCharacter) === parsed.data.selectedCharacterId;
    const answered = await PracticeSession.findOneAndUpdate({ _id: session._id, user: req.user._id, status: 'pending' }, { $set: { selectedCharacter: parsed.data.selectedCharacterId, isCorrect, status: 'answered', answeredAt: new Date() } }, { new: true });
    if (!answered) return res.status(409).json({ message: 'This question has already been answered.' });
    const character = await Character.findById(session.targetCharacter);
    if (character) {
      const prior = await LearningProgress.findOne({ user: req.user._id, character: character._id }).select('status');
      const elapsedSeconds = Math.min(1800, Math.max(0, Math.floor((Date.now() - session.createdAt.getTime()) / 1000)));
      const update = { $setOnInsert: { user: req.user._id, character: character._id, language: character.language, variety: character.variety, script: character.script, category: character.category, status: 'not-started' }, $set: { lastPracticeAt: new Date(), status: prior?.status === 'completed' ? 'completed' : 'practised' }, $inc: { practiceCount: 1, quizAttempts: 1, learningTimeSeconds: elapsedSeconds, ...(session.mode === 'listening' ? { listeningExercises: 1 } : {}), ...(isCorrect ? { correctAnswers: 1 } : {}) } };
      await LearningProgress.findOneAndUpdate({ user: req.user._id, character: character._id }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
    }
    return res.json({ isCorrect, correctCharacterId: String(session.correctCharacter) });
  } catch (error) { return next(error); }
});

router.get('/progress', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1), limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const filter = { user: req.user._id };
    for (const key of ['language', 'variety', 'script', 'category']) if (req.query[key]) { if (!mongoose.isValidObjectId(req.query[key])) return res.status(400).json({ message: `Invalid ${key} ID.` }); filter[key] = req.query[key]; }
    const aggregateMatch = { user: new mongoose.Types.ObjectId(String(req.user._id)) };
    for (const key of ['language', 'script', 'variety', 'category']) if (filter[key]) aggregateMatch[key] = new mongoose.Types.ObjectId(String(filter[key]));
    const [items, total, counts] = await Promise.all([LearningProgress.find(filter).populate('character', 'grapheme displayForm name learningOrder').sort({ lastPracticeAt: -1, updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), LearningProgress.countDocuments(filter), LearningProgress.aggregate([{ $match: aggregateMatch }, { $group: { _id: '$status', count: { $sum: 1 }, viewed: { $sum: '$viewedCount' }, practised: { $sum: '$practiceCount' }, writing: { $sum: '$writingExercises' }, listening: { $sum: '$listeningExercises' }, quizzes: { $sum: '$quizAttempts' }, correct: { $sum: '$correctAnswers' }, seconds: { $sum: '$learningTimeSeconds' } } }])]);
    return res.json({ progress: items, summary: summarize(counts), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
});
router.get('/progress/:languageId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.languageId)) return res.status(400).json({ message: 'Invalid language ID.' });
    const [items, counts] = await Promise.all([LearningProgress.find({ user: req.user._id, language: req.params.languageId }).populate('character', 'grapheme displayForm name learningOrder').sort({ lastPracticeAt: -1 }).limit(200).lean(), LearningProgress.aggregate([{ $match: { user: new mongoose.Types.ObjectId(String(req.user._id)), language: new mongoose.Types.ObjectId(req.params.languageId) } }, { $group: { _id: '$status', count: { $sum: 1 }, quizzes: { $sum: '$quizAttempts' }, correct: { $sum: '$correctAnswers' }, seconds: { $sum: '$learningTimeSeconds' } } }])]);
    return res.json({ progress: items, summary: summarize(counts) });
  } catch (error) { return next(error); }
});
router.put('/progress/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Progress record not found.' });
    const parsed = z.object({ status: z.enum(['not-started', 'learning', 'practised', 'completed']) }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Choose a valid progress status.' });
    const progress = await LearningProgress.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { $set: { status: parsed.data.status, lastPracticeAt: new Date() } }, { new: true });
    if (!progress) return res.status(404).json({ message: 'Progress record not found.' });
    return res.json({ progress });
  } catch (error) { return next(error); }
});

function characterChoice(item) { return { _id: String(item._id), grapheme: item.grapheme, displayForm: item.displayForm || item.grapheme, name: item.name || item.nativeName || item.transliteration }; }
function uniqueLabels(items) { const seen = new Set(); return items.filter((item) => { const label = String(item.name || item.nativeName || item.transliteration).trim().toLocaleLowerCase(); if (seen.has(label)) return false; seen.add(label); return true; }); }
function shuffle(items) { const copy = [...items]; for (let index = copy.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [copy[index], copy[swap]] = [copy[swap], copy[index]]; } return copy; }
function summarize(groups) { const summary = { total: 0, notStarted: 0, learning: 0, practised: 0, completed: 0, viewed: 0, practiceCount: 0, writingExercises: 0, listeningExercises: 0, quizAttempts: 0, correctAnswers: 0, learningTimeSeconds: 0 }; for (const group of groups) { summary.total += group.count; const key = group._id === 'not-started' ? 'notStarted' : group._id; if (Object.hasOwn(summary, key)) summary[key] += group.count; summary.viewed += group.viewed || 0; summary.practiceCount += group.practised || 0; summary.writingExercises += group.writing || 0; summary.listeningExercises += group.listening || 0; summary.quizAttempts += group.quizzes || 0; summary.correctAnswers += group.correct || 0; summary.learningTimeSeconds += group.seconds || 0; } return summary; }
export default router;
