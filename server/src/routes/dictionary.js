import { Router } from 'express';
import mongoose from 'mongoose';
import { Vocabulary } from '../models/Vocabulary.js';
import { WordMeaning } from '../models/WordMeaning.js';
import { Language } from '../models/Language.js';
import { LanguageVariety } from '../models/LanguageVariety.js';
import { getMeanings, getTranslations, getPronunciations } from './vocabulary.js';
const router = Router();
const live = { status: 'published', isActive: true, 'verification.status': 'verified' };
const languageLive = { $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] };
router.get('/dictionary/search', async (req, res, next) => {
  try {
    const { sourceLanguage, targetLanguage } = req.query;
    if (!mongoose.isValidObjectId(sourceLanguage) || !mongoose.isValidObjectId(targetLanguage)) return res.status(400).json({ message: 'Choose both a source and target language.' });
    const languages = await Language.find({ _id: { $in: [sourceLanguage, targetLanguage] }, ...languageLive }).distinct('_id');
    if (languages.length !== 2) return res.status(404).json({ message: 'Language not found.' });
    const sourceVariety = req.query.sourceVariety || null, targetVariety = req.query.targetVariety || null;
    for (const [id, lang] of [[sourceVariety, sourceLanguage], [targetVariety, targetLanguage]]) if (id && (!mongoose.isValidObjectId(id) || !(await LanguageVariety.exists({ _id: id, language: lang, status: 'published', isActive: true })))) return res.status(404).json({ message: 'Language variety not found.' });
    const q = String(req.query.q || '').trim().slice(0, 80);
    if (!q) return res.json({ entries: [], pagination: { page: 1, limit: 24, total: 0, pages: 0 } });
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const meanings = await WordMeaning.find({ ...live, definition: regex }).distinct('vocabulary');
    const filter = { ...live, language: sourceLanguage, variety: sourceVariety, $or: [{ nativeForm: regex }, { romanTransliteration: regex }, { alternativeForms: regex }, ...(meanings.length ? [{ _id: { $in: meanings } }] : [])] };
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1), limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const [words, total] = await Promise.all([Vocabulary.find(filter).select('language variety script nativeForm romanTransliteration alternativeForms partOfSpeech').populate('language', 'name nativeName').populate('variety', 'name nativeName').sort({ nativeForm: 1 }).skip((page - 1) * limit).limit(limit).lean(), Vocabulary.countDocuments(filter)]);
    const ids = words.map((word) => word._id);
    const [meaningMap, translationMap, pronunciations] = await Promise.all([getMeanings(ids), getTranslations(ids, targetLanguage, sourceVariety, targetVariety), getPronunciations(ids)]);
    const entries = words.map((word) => ({ ...word, meanings: meaningMap.get(String(word._id)) || [], translations: translationMap.get(String(word._id)) || [], pronunciations: pronunciations.get(String(word._id)) || [] }));
    return res.json({ entries, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) { return next(e); }
});
router.get('/dictionary/entry/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Dictionary entry not found.' });
    const word = await Vocabulary.findOne({ _id: req.params.id, ...live }).select('language variety script nativeForm romanTransliteration alternativeForms partOfSpeech').populate('language', 'name nativeName').populate('variety', 'name nativeName').lean();
    if (!word || !(await Language.exists({ _id: word.language._id, ...languageLive }))) return res.status(404).json({ message: 'Dictionary entry not found.' });
    const [meanings, translations, pronunciations] = await Promise.all([getMeanings([word._id]), getTranslations([word._id]), getPronunciations([word._id])]);
    return res.json({ entry: { ...word, meanings: meanings.get(String(word._id)) || [], translations: translations.get(String(word._id)) || [], pronunciations: pronunciations.get(String(word._id)) || [] } });
  } catch (e) { return next(e); }
});
export default router;
