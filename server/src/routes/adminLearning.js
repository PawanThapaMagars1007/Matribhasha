import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { Language } from '../models/Language.js';
import { LanguageVariety } from '../models/LanguageVariety.js';
import { Script } from '../models/Script.js';
import { CharacterCategory } from '../models/CharacterCategory.js';
import { Character } from '../models/Character.js';
import { Pronunciation } from '../models/Pronunciation.js';
import { AudioAsset } from '../models/AudioAsset.js';
import { ContentRevision } from '../models/ContentRevision.js';

const router = Router();
const editorRoles = ['superAdmin', 'languageAdmin', 'languageExpert', 'reviewer'];
const reviewRoles = ['superAdmin', 'languageAdmin', 'languageExpert', 'reviewer'];
const edit = [requireAuth, requireRoles(...editorRoles)];
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const verificationStatus = z.enum(['unreviewed', 'pending', 'verified', 'needs-review']);
const publicationStatus = z.enum(['draft', 'under-review', 'published', 'archived']);
const categoryFields = { language: objectId.optional(), variety: objectId.nullable().optional(), script: objectId.optional(), name: z.string().trim().min(1).max(100).optional(), nativeName: z.string().max(100).optional(), description: z.string().max(1500).optional(), learningOrder: z.number().int().min(0).max(10000).optional() };
const characterFields = { language: objectId.optional(), variety: objectId.nullable().optional(), script: objectId.optional(), category: objectId.nullable().optional(), grapheme: z.string().trim().min(1).max(32).optional(), displayForm: z.string().max(32).optional(), name: z.string().max(100).optional(), nativeName: z.string().max(100).optional(), description: z.string().max(2000).optional(), contextNotes: z.string().max(2000).optional(), learningOrder: z.number().int().min(0).max(10000).optional(), transliteration: z.string().max(100).optional(), romanRepresentation: z.string().max(100).optional(), examples: z.array(z.object({ text: z.string().trim().min(1).max(200), romanization: z.string().max(200).optional(), translation: z.string().max(300).optional(), explanation: z.string().max(500).optional(), source: z.string().max(500).optional(), verificationStatus: verificationStatus.optional() }).strict()).max(30).optional(), relatedCharacters: z.array(objectId).max(30).optional() };

router.get('/revisions/:entityType/:id', ...edit, async (req, res, next) => {
  try {
    if (!['category', 'character', 'pronunciation'].includes(req.params.entityType) || !mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Content history not found.' });
    const revisions = await ContentRevision.find({ entityType: req.params.entityType, entity: req.params.id }).sort({ createdAt: -1 }).limit(50).populate('changedBy', 'name username').lean();
    return res.json({ revisions });
  } catch (error) { return next(error); }
});

router.get('/categories', ...edit, async (req, res, next) => {
  try { const page = pageNum(req.query.page), limit = limitNum(req.query.limit); const filter = {}; if (req.query.status) filter.status = req.query.status; const [categories, total] = await Promise.all([CharacterCategory.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), CharacterCategory.countDocuments(filter)]); return res.json({ categories, pagination: paginate(page, limit, total) }); }
  catch (error) { return next(error); }
});
router.post('/categories', ...edit, async (req, res, next) => {
  try {
    const parsed = z.object({ language: objectId, variety: objectId.nullable().optional(), script: objectId, name: z.string().trim().min(1).max(100), nativeName: z.string().max(100).optional(), description: z.string().max(1500).optional(), learningOrder: z.number().int().min(0).max(10000).optional(), source: z.string().max(1000).optional() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Please check the category details.' });
    const { source, ...data } = parsed.data; const relationError = await validateLearningRefs(data.language, data.script, data.variety); if (relationError) return res.status(400).json({ message: relationError });
    const category = await CharacterCategory.create({ ...data, verification: { status: 'pending', source: source || '' }, status: 'under-review', createdBy: req.user._id });
    return res.status(201).json({ category });
  } catch (error) { return next(error); }
});
router.put('/categories/:id', ...edit, async (req, res, next) => {
  try {
    const current = await findById(CharacterCategory, req.params.id, res, 'Category'); if (!current) return;
    const parsed = z.object({ ...categoryFields, source: z.string().max(1000).optional(), status: publicationStatus.optional(), verificationStatus: verificationStatus.optional(), isActive: z.boolean().optional() }).strict().safeParse(req.body);
    if (!parsed.success || !Object.keys(parsed.data || {}).length) return res.status(400).json({ message: 'Please provide valid category details.' });
    if (blockReviewFields(req, parsed.data, res)) return;
    const values = { ...parsed.data, updatedBy: req.user._id }; delete values.source;
    const association = await validateLearningRefs(values.language || current.language, values.script || current.script, values.variety === undefined ? current.variety : values.variety); if (association) return res.status(400).json({ message: association });
    if (parsed.data.status === 'published' && (parsed.data.verificationStatus || current.verification.status) !== 'verified') return res.status(400).json({ message: 'A category must be verified before publication.' });
    const verification = reviewUpdate(req, parsed.data, current); if (verification) values.verification = verification;
    await recordRevision('category', current, req.user._id);
    const category = await CharacterCategory.findByIdAndUpdate(current._id, { $set: values }, { new: true, runValidators: true });
    return res.json({ category });
  } catch (error) { return next(error); }
});

router.get('/characters', ...edit, async (req, res, next) => {
  try { const page = pageNum(req.query.page), limit = limitNum(req.query.limit); const filter = {}; if (req.query.status) filter.status = req.query.status; if (req.query.language && mongoose.isValidObjectId(req.query.language)) filter.language = req.query.language; const [characters, total] = await Promise.all([Character.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).populate('language', 'name').populate('script', 'name').lean(), Character.countDocuments(filter)]); return res.json({ characters, pagination: paginate(page, limit, total) }); }
  catch (error) { return next(error); }
});
router.get('/pronunciations', ...edit, async (req, res, next) => {
  try { const page = pageNum(req.query.page), limit = limitNum(req.query.limit); const filter = {}; if (req.query.status) filter.status = req.query.status; if (req.query.character && mongoose.isValidObjectId(req.query.character)) filter.character = req.query.character; const [pronunciations, total] = await Promise.all([Pronunciation.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).populate('character', 'grapheme displayForm name').populate('audioAsset', 'format status attribution').lean(), Pronunciation.countDocuments(filter)]); return res.json({ pronunciations, pagination: paginate(page, limit, total) }); }
  catch (error) { return next(error); }
});
router.post('/characters', ...edit, async (req, res, next) => {
  try {
    const parsed = z.object({ language: objectId, variety: objectId.nullable().optional(), script: objectId, category: objectId.nullable().optional(), grapheme: z.string().trim().min(1).max(32), displayForm: z.string().max(32).optional(), name: z.string().max(100).optional(), nativeName: z.string().max(100).optional(), description: z.string().max(2000).optional(), contextNotes: z.string().max(2000).optional(), learningOrder: z.number().int().min(0).max(10000).optional(), transliteration: z.string().max(100).optional(), romanRepresentation: z.string().max(100).optional(), examples: characterFields.examples.optional(), relatedCharacters: z.array(objectId).max(30).optional(), source: z.string().max(1000).optional() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Please check the character details.' });
    const { source, ...data } = parsed.data; const relationError = await validateLearningRefs(data.language, data.script, data.variety, data.category); if (relationError) return res.status(400).json({ message: relationError });
    if (data.relatedCharacters?.length) { const related = await Character.find({ _id: { $in: data.relatedCharacters }, language: data.language, script: data.script }).select('_id').lean(); if (related.length !== new Set(data.relatedCharacters).size) return res.status(400).json({ message: 'Related characters must belong to the same language and script.' }); }
    const character = await Character.create({ ...data, verification: { status: 'pending', source: source || '' }, status: 'under-review', createdBy: req.user._id });
    return res.status(201).json({ character });
  } catch (error) { return next(error); }
});
router.put('/characters/:id', ...edit, async (req, res, next) => {
  try {
    const current = await findById(Character, req.params.id, res, 'Character'); if (!current) return;
    const parsed = z.object({ ...characterFields, source: z.string().max(1000).optional(), status: publicationStatus.optional(), verificationStatus: verificationStatus.optional(), isActive: z.boolean().optional() }).strict().safeParse(req.body);
    if (!parsed.success || !Object.keys(parsed.data || {}).length) return res.status(400).json({ message: 'Please provide valid character details.' });
    if (blockReviewFields(req, parsed.data, res)) return;
    const values = { ...parsed.data, updatedBy: req.user._id }; delete values.source;
    const association = await validateLearningRefs(values.language || current.language, values.script || current.script, values.variety === undefined ? current.variety : values.variety, values.category === undefined ? current.category : values.category); if (association) return res.status(400).json({ message: association });
    if (values.relatedCharacters?.length) { const related = await Character.find({ _id: { $in: values.relatedCharacters }, language: values.language || current.language, script: values.script || current.script }).select('_id').lean(); if (related.length !== new Set(values.relatedCharacters).size) return res.status(400).json({ message: 'Related characters must belong to the same language and script.' }); }
    if (parsed.data.status === 'published' && (parsed.data.verificationStatus || current.verification.status) !== 'verified') return res.status(400).json({ message: 'A character must be verified before publication.' });
    const examplesToPublish = values.examples || current.examples;
    if (parsed.data.status === 'published' && examplesToPublish.some((example) => example.verificationStatus !== 'verified')) return res.status(400).json({ message: 'Every example must be verified before the character is published.' });
    const verification = reviewUpdate(req, parsed.data, current); if (verification) values.verification = verification;
    await recordRevision('character', current, req.user._id);
    const character = await Character.findByIdAndUpdate(current._id, { $set: values }, { new: true, runValidators: true });
    return res.json({ character });
  } catch (error) { return next(error); }
});

router.post('/pronunciations', ...edit, async (req, res, next) => {
  try {
    const parsed = z.object({ character: objectId, variety: objectId.nullable().optional(), notation: z.enum(['ipa', 'romanization', 'description', 'other']).optional(), notationText: z.string().max(150).optional(), context: z.string().max(1000).optional(), audioAsset: objectId.nullable().optional(), speakerLabel: z.string().max(100).optional(), source: z.string().max(500).optional(), attribution: z.string().max(300).optional() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Please check the pronunciation details.' });
    const character = await Character.findById(parsed.data.character); if (!character) return res.status(404).json({ message: 'Character not found.' });
    if (parsed.data.variety && character.variety && String(character.variety) !== parsed.data.variety) return res.status(400).json({ message: 'The pronunciation variety must match the character variety.' });
    if (parsed.data.variety && !(await LanguageVariety.exists({ _id: parsed.data.variety, language: character.language }))) return res.status(400).json({ message: 'The pronunciation variety must belong to the character language.' });
    if (parsed.data.audioAsset && !(await AudioAsset.exists({ _id: parsed.data.audioAsset, status: 'published', 'verification.status': 'verified', consentRecorded: true }))) return res.status(400).json({ message: 'Only approved audio with recorded consent can be attached.' });
    const pronunciation = await Pronunciation.create({ ...parsed.data, language: character.language, variety: parsed.data.variety || character.variety, verification: { status: 'pending' }, status: 'under-review', createdBy: req.user._id });
    return res.status(201).json({ pronunciation });
  } catch (error) { return next(error); }
});
router.put('/pronunciations/:id', ...edit, async (req, res, next) => {
  try {
    const current = await findById(Pronunciation, req.params.id, res, 'Pronunciation'); if (!current) return;
    const parsed = z.object({ notation: z.enum(['ipa', 'romanization', 'description', 'other']).optional(), notationText: z.string().max(150).optional(), context: z.string().max(1000).optional(), audioAsset: objectId.nullable().optional(), speakerLabel: z.string().max(100).optional(), source: z.string().max(500).optional(), attribution: z.string().max(300).optional(), status: publicationStatus.optional(), verificationStatus: verificationStatus.optional(), isActive: z.boolean().optional() }).strict().safeParse(req.body);
    if (!parsed.success || !Object.keys(parsed.data || {}).length) return res.status(400).json({ message: 'Please provide valid pronunciation details.' });
    if (blockReviewFields(req, parsed.data, res)) return;
    const values = { ...parsed.data }; delete values.verificationStatus;
    const audioAsset = values.audioAsset === undefined ? current.audioAsset : values.audioAsset;
    if (audioAsset && !(await AudioAsset.exists({ _id: audioAsset, status: 'published', 'verification.status': 'verified', consentRecorded: true }))) return res.status(400).json({ message: 'Only approved audio with recorded consent can be attached.' });
    if (parsed.data.status === 'published' && (parsed.data.verificationStatus || current.verification.status) !== 'verified') return res.status(400).json({ message: 'Pronunciation details must be verified before publication.' });
    if (parsed.data.verificationStatus) values.verification = { ...current.verification.toObject(), status: parsed.data.verificationStatus, reviewedBy: req.user._id, reviewedAt: new Date() };
    await recordRevision('pronunciation', current, req.user._id);
    const pronunciation = await Pronunciation.findByIdAndUpdate(current._id, { $set: values }, { new: true, runValidators: true });
    return res.json({ pronunciation });
  } catch (error) { return next(error); }
});

async function validateLearningRefs(languageId, scriptId, varietyId, categoryId) {
  const language = await Language.findById(languageId).select('_id'); if (!language) return 'Language was not found.';
  const script = await Script.findById(scriptId).select('languages varieties'); if (!script) return 'Script was not found.';
  if (!script.languages.some((id) => String(id) === String(language._id))) return 'The script is not associated with this language.';
  if (varietyId) { const variety = await LanguageVariety.findOne({ _id: varietyId, language: language._id }).select('_id'); if (!variety) return 'The variety does not belong to the selected language.'; if (script.varieties.length && !script.varieties.some((id) => String(id) === String(variety._id))) return 'The script is not associated with this variety.'; }
  if (categoryId) { const category = await CharacterCategory.findById(categoryId).select('language script variety'); if (!category || String(category.language) !== String(language._id) || String(category.script) !== String(script._id) || String(category.variety || '') !== String(varietyId || '')) return 'The category must match the selected language, variety, and script.'; }
  return null;
}
function blockReviewFields(req, data, res) { if ((data.status === 'published' || data.verificationStatus === 'verified') && !reviewRoles.includes(req.user.role)) { res.status(403).json({ message: 'Only reviewers can verify and publish learning content.' }); return true; } return false; }
function reviewUpdate(req, data, current) { if (!reviewRoles.includes(req.user.role) || (!data.verificationStatus && data.status !== 'published')) return null; const status = data.verificationStatus || current.verification?.status || 'pending'; return { ...(current.verification?.toObject?.() || current.verification || {}), status, reviewedBy: req.user._id, reviewedAt: new Date(), ...(data.source !== undefined ? { source: data.source } : {}) }; }
async function recordRevision(entityType, doc, userId) { await ContentRevision.create({ entityType, entity: doc._id, snapshot: doc.toObject(), changedBy: userId }); }
async function findById(Model, id, res, label) { if (!mongoose.isValidObjectId(id)) { res.status(404).json({ message: `${label} not found.` }); return null; } const doc = await Model.findById(id); if (!doc) res.status(404).json({ message: `${label} not found.` }); return doc; }
function pageNum(value) { return Math.max(1, Number.parseInt(value, 10) || 1); }
function limitNum(value) { return Math.min(50, Math.max(1, Number.parseInt(value, 10) || 24)); }
function paginate(page, limit, total) { return { page, limit, total, pages: Math.ceil(total / limit) }; }

export default router;
