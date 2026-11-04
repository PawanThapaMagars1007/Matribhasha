import { Router } from 'express';
import mongoose from 'mongoose';
import { Vocabulary } from '../models/Vocabulary.js';
import { VocabularyCategory } from '../models/VocabularyCategory.js';
import { WordMeaning } from '../models/WordMeaning.js';
import { Translation } from '../models/Translation.js';
import { ExampleSentence } from '../models/ExampleSentence.js';
import { Pronunciation } from '../models/Pronunciation.js';
import { Language } from '../models/Language.js';
import { LanguageVariety } from '../models/LanguageVariety.js';
import { Script } from '../models/Script.js';

const router = Router();
const live = { status: 'published', isActive: true, 'verification.status': 'verified' };
const audioLive = { status: 'published', 'verification.status': 'verified', consentRecorded: true };

router.get('/vocabulary/categories', async (req, res, next) => {
  try {
    const filter = { ...live };
    if (req.query.language) { if (!mongoose.isValidObjectId(req.query.language)) return res.status(400).json({ message: 'Invalid language ID.' }); filter.language = req.query.language; }
    if (req.query.variety) { if (!mongoose.isValidObjectId(req.query.variety)) return res.status(400).json({ message: 'Invalid variety ID.' }); filter.variety = req.query.variety; } else filter.variety = null;
    const categories = await VocabularyCategory.find(filter).sort({ learningOrder: 1, name: 1 }).lean();
    return res.json({ categories });
  } catch (error) { return next(error); }
});
router.get('/languages/:languageId/vocabulary', async (req, res, next) => listVocabulary(req, res, next, { language: req.params.languageId }));
router.get('/vocabulary/search', async (req, res, next) => listVocabulary(req, res, next, {}));
router.get('/vocabulary', async (req, res, next) => listVocabulary(req, res, next, {}));
router.get('/vocabulary/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Vocabulary entry not found.' });
    const vocabulary = await Vocabulary.findOne({ _id: req.params.id, ...live }).populate('language', 'name nativeName code').populate({ path: 'variety', match: { status: 'published', isActive: true }, select: 'name nativeName' }).populate({ path: 'script', match: { status: 'published', isActive: true }, select: 'name nativeName' }).populate({ path: 'category', match: live, select: 'name nativeName' }).populate({ path: 'relatedVocabulary', match: live, select: 'nativeForm romanTransliteration language variety' }).populate({ path: 'synonyms', match: live, select: 'nativeForm romanTransliteration' }).populate({ path: 'antonyms', match: live, select: 'nativeForm romanTransliteration' }).lean();
    if (!vocabulary || !vocabulary.language || !(await languageIsPublished(vocabulary.language._id))) return res.status(404).json({ message: 'Vocabulary entry not found.' });
    const [meanings, translations, exampleSentences, pronunciations] = await Promise.all([
      WordMeaning.find({ vocabulary: vocabulary._id, ...live }).sort({ contextLabel: 1 }).lean(),
      getTranslations([vocabulary._id]),
      ExampleSentence.find({ vocabulary: vocabulary._id, ...live }).populate({ path: 'audioAsset', match: audioLive, select: 'format mimeType durationSeconds attribution speakerLabel' }).lean(),
      getPronunciations([vocabulary._id]),
    ]);
    for (const sentence of exampleSentences) sentence.translations = (sentence.translations || []).filter((row) => row.verificationStatus === 'verified');
    return res.json({ vocabulary: { ...vocabulary, meanings, translations: translations.get(String(vocabulary._id)) || [], exampleSentences, pronunciations: pronunciations.get(String(vocabulary._id)) || [] } });
  } catch (error) { return next(error); }
});

async function listVocabulary(req, res, next, base) {
  try {
    for (const [key, value] of Object.entries(base)) if (!mongoose.isValidObjectId(value)) return res.status(400).json({ message: `Invalid ${key} ID.` });
    const filter = { ...base, ...live };
    const languageId = base.language || req.query.language;
    if (languageId) {
      if (!mongoose.isValidObjectId(languageId)) return res.status(400).json({ message: 'Invalid language ID.' });
      if (!(await languageIsPublished(languageId))) return res.status(404).json({ message: 'Language not found.' });
      filter.language = languageId;
    } else filter.language = { $in: await Language.find({ $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] }).distinct('_id') };
    const varietyId = req.query.variety;
    if (varietyId) {
      if (!mongoose.isValidObjectId(varietyId) || !(await LanguageVariety.exists({ _id: varietyId, status: 'published', isActive: true }))) return res.status(404).json({ message: 'Variety not found.' });
      filter.variety = varietyId;
    } else filter.variety = null;
    if (req.query.category) { if (!mongoose.isValidObjectId(req.query.category)) return res.status(400).json({ message: 'Invalid category ID.' }); filter.category = req.query.category; }
    if (req.query.script) { if (!mongoose.isValidObjectId(req.query.script) || !(await Script.exists({ _id: req.query.script, status: 'published', isActive: true }))) return res.status(404).json({ message: 'Script not found.' }); filter.script = req.query.script; }
    const targetLanguage = req.query.targetLanguage;
    if (targetLanguage && (!mongoose.isValidObjectId(targetLanguage) || !(await languageIsPublished(targetLanguage)))) return res.status(404).json({ message: 'Target language not found.' });
    const targetVariety = req.query.targetVariety;
    if (targetVariety && (!mongoose.isValidObjectId(targetVariety) || !(await LanguageVariety.exists({ _id: targetVariety, status: 'published', isActive: true })))) return res.status(404).json({ message: 'Target variety not found.' });
    const q = String(req.query.q || '').trim().slice(0, 80);
    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      const meaningVocabularyIds = await WordMeaning.find({ ...live, definition: regex }).distinct('vocabulary');
      filter.$or = [{ nativeForm: regex }, { romanTransliteration: regex }, { alternativeForms: regex }, ...(meaningVocabularyIds.length ? [{ _id: { $in: meaningVocabularyIds } }] : [])];
    }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1), limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const [entries, total] = await Promise.all([Vocabulary.find(filter).select('language variety script category nativeForm romanTransliteration alternativeForms partOfSpeech categoryLabel meanings source exampleSentences').populate('language', 'name nativeName').populate('variety', 'name nativeName').populate('script', 'name nativeName').populate('category', 'name nativeName').populate({ path: 'exampleSentences', match: live, select: 'text romanTransliteration translations audioAsset' }).populate({ path: 'exampleSentences.audioAsset', match: audioLive, select: 'format mimeType durationSeconds attribution speakerLabel' }).sort({ nativeForm: 1 }).skip((page - 1) * limit).limit(limit).lean(), Vocabulary.countDocuments(filter)]);
    for (const entry of entries) entry.exampleSentences = (entry.exampleSentences || []).map((sentence) => ({ ...sentence, translations: (sentence.translations || []).filter((row) => row.verificationStatus === 'verified') }));
    const ids = entries.map((entry) => entry._id);
    const [meaningMap, translationMap, pronunciationMap] = await Promise.all([getMeanings(ids), targetLanguage ? getTranslations(ids, targetLanguage, varietyId || null, targetVariety || null) : Promise.resolve(new Map()), getPronunciations(ids)]);
    const vocabulary = entries.map((entry) => ({ ...entry, meanings: meaningMap.get(String(entry._id)) || [], translations: translationMap.get(String(entry._id)) || [], pronunciations: pronunciationMap.get(String(entry._id)) || [] }));
    return res.json({ vocabulary, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
}

export async function getMeanings(ids) { const rows = await WordMeaning.find({ vocabulary: { $in: ids }, ...live }).sort({ contextLabel: 1 }).lean(); return groupBy(rows, (row) => String(row.vocabulary)); }
export async function getTranslations(ids, targetLanguage, sourceVariety, targetVariety) {
  const filter = { sourceVocabulary: { $in: ids }, ...live };
  if (targetLanguage) filter.targetLanguage = targetLanguage;
  else filter.targetLanguage = { $in: await Language.find({ $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] }).distinct('_id') };
  if (sourceVariety !== undefined) filter.sourceVariety = sourceVariety || null;
  if (targetVariety !== undefined) filter.targetVariety = targetVariety || null;
  const rows = await Translation.find(filter).populate({ path: 'targetVocabulary', match: live, select: 'nativeForm romanTransliteration language variety' }).populate({ path: 'targetMeaning', match: live, select: 'definition contextualExplanation contextLabel' }).populate({ path: 'sourceMeaning', match: live, select: 'definition contextualExplanation contextLabel' }).populate('targetLanguage', 'name nativeName').populate('targetVariety', 'name nativeName').lean();
  return groupBy(rows.filter((row) => row.targetVocabulary), (row) => String(row.sourceVocabulary));
}
export async function getPronunciations(ids) {
  const rows = await Pronunciation.find({ vocabulary: { $in: ids }, ...live }).populate({ path: 'audioAsset', match: audioLive, select: 'format mimeType durationSeconds attribution speakerLabel' }).sort({ createdAt: 1 }).lean();
  return groupBy(rows, (row) => String(row.vocabulary));
}
function groupBy(rows, keyFn) { const groups = new Map(); for (const row of rows) { const key = keyFn(row); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row); } return groups; }
async function languageIsPublished(id) { return Language.exists({ _id: id, $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] }); }
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
export default router;
