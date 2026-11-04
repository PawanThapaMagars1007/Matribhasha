import { Router } from 'express';
import mongoose from 'mongoose';
import { GrammarCategory } from '../models/GrammarCategory.js';
import { GrammarLesson } from '../models/GrammarLesson.js';
import { ExampleSentence } from '../models/ExampleSentence.js';
import { SentenceExercise } from '../models/SentenceExercise.js';
import { Language } from '../models/Language.js';
import { LanguageVariety } from '../models/LanguageVariety.js';

const router = Router();
const live = { status: 'published', isActive: true, 'verification.status': 'verified' };
const languageLive = { $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] };
const audioLive = { status: 'published', 'verification.status': 'verified', consentRecorded: true };

router.get('/grammar/categories', async (req, res, next) => {
  try {
    const filter = { ...live };
    if (req.query.language) filter.language = req.query.language;
    if (req.query.variety) filter.variety = req.query.variety; else filter.variety = null;
    const categories = await GrammarCategory.find(filter).sort({ learningOrder: 1, name: 1 }).lean();
    return res.json({ categories });
  } catch (error) { return next(error); }
});
router.get('/languages/:languageId/grammar', (req, res, next) => listLessons(req, res, next, req.params.languageId));
router.get('/grammar', (req, res, next) => listLessons(req, res, next));
router.get('/grammar/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Grammar lesson not found.' });
    const lesson = await GrammarLesson.findOne({ _id: req.params.id, ...live }).populate('category', 'name nativeName').lean();
    if (!lesson || !(await Language.exists({ _id: lesson.language, ...languageLive }))) return res.status(404).json({ message: 'Grammar lesson not found.' });
    const examples = await ExampleSentence.find({ _id: { $in: lesson.exampleSentences }, ...live }).populate({ path: 'audioAsset', match: audioLive, select: 'format mimeType durationSeconds attribution speakerLabel' }).populate('vocabulary', 'nativeForm romanTransliteration').lean();
    return res.json({ lesson: { ...lesson, exampleSentences: examples } });
  } catch (error) { return next(error); }
});
router.get('/languages/:languageId/sentences', (req, res, next) => listSentences(req, res, next, req.params.languageId));
router.get('/sentences', (req, res, next) => listSentences(req, res, next));
router.get('/sentences/exercises', async (req, res, next) => {
  try {
    const filter = { ...live };
    if (!mongoose.isValidObjectId(req.query.language) || !(await Language.exists({ _id: req.query.language, ...languageLive }))) return res.status(404).json({ message: 'Language not found.' });
    filter.language = req.query.language;
    if (req.query.variety) filter.variety = req.query.variety; else filter.variety = null;
    const exercises = await SentenceExercise.find(filter).select('language variety type prompt instructions choices.id choices.label tokens.id tokens.text difficulty sentence grammarLesson').sort({ difficulty: 1, createdAt: -1 }).limit(50).lean();
    return res.json({ exercises });
  } catch (error) { return next(error); }
});
router.get('/sentences/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Sentence not found.' });
    const sentence = await ExampleSentence.findOne({ _id: req.params.id, ...live }).populate('vocabulary', 'nativeForm romanTransliteration').populate({ path: 'audioAsset', match: audioLive, select: 'format mimeType durationSeconds attribution speakerLabel' }).lean();
    if (!sentence || !(await Language.exists({ _id: sentence.language, ...languageLive }))) return res.status(404).json({ message: 'Sentence not found.' });
    sentence.translations = (sentence.translations || []).filter((row) => row.verificationStatus === 'verified');
    return res.json({ sentence });
  } catch (error) { return next(error); }
});
async function listLessons(req, res, next, languageId) {
  try {
    const filter = { ...live };
    if (languageId || req.query.language) {
      const id = languageId || req.query.language;
      if (!mongoose.isValidObjectId(id) || !(await Language.exists({ _id: id, ...languageLive }))) return res.status(404).json({ message: 'Language not found.' });
      filter.language = id;
    }
    if (req.query.variety) filter.variety = req.query.variety; else if (req.query.language || languageId) filter.variety = null;
    if (req.query.category) filter.category = req.query.category;
    const lessons = await GrammarLesson.find(filter).select('-explanation -exceptions').populate('category', 'name nativeName').sort({ difficulty: 1, title: 1 }).limit(100).lean();
    return res.json({ lessons });
  } catch (error) { return next(error); }
}
async function listSentences(req, res, next, languageId) {
  try {
    const filter = { ...live };
    if (languageId || req.query.language) {
      const id = languageId || req.query.language;
      if (!mongoose.isValidObjectId(id) || !(await Language.exists({ _id: id, ...languageLive }))) return res.status(404).json({ message: 'Language not found.' });
      filter.language = id;
    }
    if (req.query.variety) filter.variety = req.query.variety; else if (req.query.language || languageId) filter.variety = null;
    const sentences = await ExampleSentence.find(filter).select('-grammarNotes -source').populate('vocabulary', 'nativeForm romanTransliteration').populate({ path: 'audioAsset', match: audioLive, select: 'format mimeType durationSeconds attribution speakerLabel' }).sort({ createdAt: -1 }).limit(100).lean();
    for (const sentence of sentences) sentence.translations = (sentence.translations || []).filter((row) => row.verificationStatus === 'verified');
    return res.json({ sentences });
  } catch (error) { return next(error); }
}
export default router;
