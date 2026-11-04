import { Router } from 'express';
import mongoose from 'mongoose';
import { Character } from '../models/Character.js';
import { CharacterCategory } from '../models/CharacterCategory.js';
import { Pronunciation } from '../models/Pronunciation.js';
import { Language } from '../models/Language.js';
import { LanguageVariety } from '../models/LanguageVariety.js';
import { Script } from '../models/Script.js';

const router = Router();
const live = { status: 'published', isActive: true, 'verification.status': 'verified' };

router.get('/characters/categories', async (req, res, next) => {
  try {
    const filter = { ...live };
    for (const key of ['language', 'variety', 'script']) if (req.query[key]) {
      if (!mongoose.isValidObjectId(req.query[key])) return res.status(400).json({ message: `Invalid ${key} ID.` });
      filter[key] = req.query[key];
    }
    if (req.query.language && !(await Language.exists({ _id: req.query.language, $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] }))) return res.status(404).json({ message: 'Language not found.' });
    if (req.query.script && !(await Script.exists({ _id: req.query.script, status: 'published', isActive: true }))) return res.status(404).json({ message: 'Script not found.' });
    if (req.query.variety && !(await LanguageVariety.exists({ _id: req.query.variety, status: 'published', isActive: true }))) return res.status(404).json({ message: 'Variety not found.' });
    if (!req.query.language) filter.language = { $in: await Language.find({ $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] }).distinct('_id') };
    if (!req.query.script) filter.script = { $in: await Script.find({ status: 'published', isActive: true }).distinct('_id') };
    if (!req.query.variety) filter.variety = null;
    const categories = await CharacterCategory.find(filter).sort({ learningOrder: 1, name: 1 }).lean();
    return res.json({ categories });
  } catch (error) { return next(error); }
});

router.get('/languages/:languageId/characters', async (req, res, next) => listCharacters(req, res, next, { language: req.params.languageId }));
router.get('/scripts/:scriptId/characters', async (req, res, next) => listCharacters(req, res, next, { script: req.params.scriptId }));
router.get('/characters', async (req, res, next) => listCharacters(req, res, next, {}));
router.get('/characters/:id/pronunciations', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Character not found.' });
    const character = await Character.findOne({ _id: req.params.id, ...live }).select('_id language script').lean();
    if (!character) return res.status(404).json({ message: 'Character not found.' });
    if (!(await languageIsPublished(character.language)) || !(await Script.exists({ _id: character.script, status: 'published', isActive: true }))) return res.status(404).json({ message: 'Character not found.' });
    const pronunciations = await Pronunciation.find({ character: character._id, ...live }).populate({ path: 'audioAsset', match: { status: 'published', 'verification.status': 'verified', consentRecorded: true }, select: 'format mimeType durationSeconds attribution speakerLabel' }).sort({ createdAt: 1 }).lean();
    return res.json({ pronunciations });
  } catch (error) { return next(error); }
});
router.get('/pronunciations/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Pronunciation not found.' });
    const pronunciation = await Pronunciation.findOne({ _id: req.params.id, ...live }).populate({ path: 'audioAsset', match: { status: 'published', 'verification.status': 'verified', consentRecorded: true }, select: 'format mimeType durationSeconds attribution speakerLabel' }).populate({ path: 'character', match: live, select: 'grapheme displayForm name script' }).populate({ path: 'vocabulary', match: live, select: 'nativeForm romanTransliteration' }).lean();
    if (!pronunciation || (!pronunciation.character && !pronunciation.vocabulary)) return res.status(404).json({ message: 'Pronunciation not found.' });
    if (!(await languageIsPublished(pronunciation.language))) return res.status(404).json({ message: 'Pronunciation not found.' });
    if (pronunciation.character && !(await Script.exists({ _id: pronunciation.character.script, status: 'published', isActive: true }))) return res.status(404).json({ message: 'Pronunciation not found.' });
    return res.json({ pronunciation });
  } catch (error) { return next(error); }
});
router.get('/characters/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Character not found.' });
    const character = await Character.findOne({ _id: req.params.id, ...live }).populate('language', 'name nativeName').populate({ path: 'variety', match: { status: 'published', isActive: true }, select: 'name nativeName' }).populate({ path: 'script', match: { status: 'published', isActive: true }, select: 'name nativeName fontRequirements' }).populate({ path: 'category', match: live, select: 'name nativeName' }).populate({ path: 'relatedCharacters', match: live, select: 'grapheme displayForm name learningOrder' }).lean();
    if (!character?.script || !character?.language || !(await languageIsPublished(character.language._id))) return res.status(404).json({ message: 'Character not found.' });
    const pronunciations = await Pronunciation.find({ character: character._id, ...live }).populate({ path: 'audioAsset', match: { status: 'published', 'verification.status': 'verified', consentRecorded: true }, select: 'format mimeType durationSeconds attribution speakerLabel' }).sort({ createdAt: 1 }).lean();
    character.pronunciations = pronunciations;
    return res.json({ character });
  } catch (error) { return next(error); }
});

async function listCharacters(req, res, next, base) {
  try {
    for (const [name, value] of Object.entries(base)) if (!mongoose.isValidObjectId(value)) return res.status(400).json({ message: `Invalid ${name} ID.` });
    if (base.language) {
      const language = await Language.findOne({ _id: base.language, $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] }).select('_id').lean();
      if (!language) return res.status(404).json({ message: 'Language not found.' });
    }
    if (base.script && !(await Script.exists({ _id: base.script, status: 'published', isActive: true }))) return res.status(404).json({ message: 'Script not found.' });
    if (base.script && req.query.script && String(base.script) !== String(req.query.script)) return res.status(400).json({ message: 'The selected script does not match this route.' });
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1), limit = Math.min(60, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
    const filter = { ...base, ...live };
    if (!base.language && req.query.language) {
      if (!mongoose.isValidObjectId(req.query.language)) return res.status(400).json({ message: 'Invalid language ID.' });
      const language = await Language.findOne({ _id: req.query.language, $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] }).select('_id').lean();
      if (!language) return res.status(404).json({ message: 'Language not found.' });
      filter.language = language._id;
    } else if (!base.language) filter.language = { $in: await Language.find({ $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] }).distinct('_id') };
    if (!base.script && req.query.script) {
      if (!mongoose.isValidObjectId(req.query.script)) return res.status(400).json({ message: 'Invalid script ID.' });
      if (!(await Script.exists({ _id: req.query.script, status: 'published', isActive: true }))) return res.status(404).json({ message: 'Script not found.' });
      filter.script = req.query.script;
    } else if (!base.script) filter.script = { $in: await Script.find({ status: 'published', isActive: true }).distinct('_id') };
    if (!req.query.variety) filter.variety = null;
    for (const key of ['variety', 'script', 'category']) if (req.query[key]) {
      if (!mongoose.isValidObjectId(req.query[key])) return res.status(400).json({ message: `Invalid ${key} ID.` });
      filter[key] = req.query[key];
    }
    if (req.query.variety && !(await LanguageVariety.exists({ _id: req.query.variety, status: 'published', isActive: true }))) return res.status(404).json({ message: 'Variety not found.' });
    const q = String(req.query.q || '').trim().slice(0, 60);
    if (q) { const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.$or = [{ grapheme: new RegExp(escaped, 'i') }, { displayForm: new RegExp(escaped, 'i') }, { name: new RegExp(escaped, 'i') }, { transliteration: new RegExp(escaped, 'i') }]; }
    const [characters, total] = await Promise.all([Character.find(filter).select('language variety script category grapheme displayForm name nativeName description learningOrder transliteration romanRepresentation examples').populate('script', 'name nativeName').populate('category', 'name nativeName').sort({ learningOrder: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(), Character.countDocuments(filter)]);
    return res.json({ characters, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
}

function languageIsPublished(id) {
  return Language.exists({ _id: id, $and: [{ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }, { $or: [{ isActive: true }, { isActive: { $exists: false } }] }] });
}

export default router;
