import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Language } from '../models/Language.js';
import { LanguageVariety } from '../models/LanguageVariety.js';
import { Script } from '../models/Script.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
const admin = requireAuth, manager = requireRoles('superAdmin', 'languageAdmin', 'languageExpert', 'reviewer');
const published = { $and: [{ $or: [{ isActive: true }, { isActive: { $exists: false } }] }, { $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }] };
const statuses = ['draft', 'under-review', 'published', 'archived'];
const availability = ['unavailable', 'planned', 'in-development', 'available'];
const verificationInput = z.object({ status: z.enum(['unreviewed', 'pending', 'verified', 'needs-review']).optional(), source: z.string().max(1000).optional() }).strict();
const languageInput = z.object({ name: z.string().trim().min(1).max(100), nativeName: z.string().max(100).optional(), nativeNameLatin: z.string().max(100).optional(), alternativeNames: z.array(z.string().max(100)).max(30).optional(), description: z.string().max(2000).optional(), code: z.string().max(35).optional(), regions: z.array(z.string().max(100)).max(30).optional(), family: z.string().max(150).optional(), familyVerification: verificationInput.optional(), status: z.enum(statuses).optional(), availability: z.enum(availability).optional(), isActive: z.boolean().optional(), resources: z.array(z.string().max(80)).max(30).optional(), scripts: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(30).optional(), verification: verificationInput.optional() }).strict();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const q = String(req.query.q || '').trim().slice(0, 100);
    const filter = { ...published, $and: [...published.$and] };
    if (q) filter.$and.push({ $or: [{ name: new RegExp(escapeRegex(q), 'i') }, { nativeName: new RegExp(escapeRegex(q), 'i') }, { alternativeNames: new RegExp(escapeRegex(q), 'i') }] });
    if (req.query.region) filter.regions = String(req.query.region).slice(0, 100);
    if (req.query.availability && availability.includes(req.query.availability)) filter.availability = req.query.availability;
    const [languages, total] = await Promise.all([Language.find(filter).select('name nativeName nativeNameLatin alternativeNames description code regions family varieties scripts verification availability resources audioAvailable status').populate({ path: 'scripts', match: { status: 'published', isActive: true }, select: 'name nativeName direction availability' }).populate({ path: 'varieties', match: { status: 'published', isActive: true }, select: 'name nativeName availability' }).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(), Language.countDocuments(filter)]);
    return res.json({ languages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
});
router.get('/managed', admin, manager, async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1), limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const filter = {};
    if (req.query.status && statuses.includes(req.query.status)) filter.status = req.query.status;
    const [languages, total] = await Promise.all([Language.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Language.countDocuments(filter)]);
    return res.json({ languages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
});
router.get('/managed/:id', admin, manager, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Language not found.' });
    const language = await Language.findById(req.params.id).populate('scripts').populate('varieties').lean();
    if (!language) return res.status(404).json({ message: 'Language not found.' });
    return res.json({ language });
  } catch (error) { return next(error); }
});
router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 100);
    if (!q) return res.json({ languages: [] });
    const languages = await Language.find({ ...published, $and: [...published.$and, { $or: [{ name: new RegExp(escapeRegex(q), 'i') }, { nativeName: new RegExp(escapeRegex(q), 'i') }, { alternativeNames: new RegExp(escapeRegex(q), 'i') }] }] }).select('name nativeName description').sort({ name: 1 }).limit(20).lean();
    return res.json({ languages });
  } catch (error) { return next(error); }
});
router.get('/:id/varieties', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Language not found.' });
    const language = await Language.findOne({ _id: req.params.id, ...published }).select('_id').lean();
    if (!language) return res.status(404).json({ message: 'Language not found.' });
    const varieties = await LanguageVariety.find({ language: language._id, status: 'published', isActive: true }).populate({ path: 'scripts', match: { status: 'published', isActive: true }, select: 'name nativeName direction' }).sort({ name: 1 }).lean();
    return res.json({ varieties });
  } catch (error) { return next(error); }
});
router.get('/:id/scripts', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Language not found.' });
    const language = await Language.findOne({ _id: req.params.id, ...published }).select('scripts').populate({ path: 'scripts', match: { status: 'published', isActive: true } }).lean();
    if (!language) return res.status(404).json({ message: 'Language not found.' });
    return res.json({ scripts: language.scripts || [] });
  } catch (error) { return next(error); }
});
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Language not found.' });
    const language = await Language.findOne({ _id: req.params.id, ...published }).populate({ path: 'scripts', match: { status: 'published', isActive: true } }).populate({ path: 'varieties', match: { status: 'published', isActive: true } }).lean();
    if (!language) return res.status(404).json({ message: 'Language not found.' });
    return res.json({ language });
  } catch (error) { return next(error); }
});

router.post('/', admin, manager, async (req, res, next) => {
  try {
    const parsed = languageInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Please check the language details.', issues: parsed.error.issues });
    const data = { ...parsed.data, createdBy: req.user._id };
    if (data.status === 'published' && data.verification?.status !== 'verified') return res.status(400).json({ message: 'A language must be verified before publication.' });
    if (data.scripts?.length) data.scripts = await getPublishedScriptIds(data.scripts);
    const language = await Language.create(data);
    if (language.scripts.length) await Script.updateMany({ _id: { $in: language.scripts } }, { $addToSet: { languages: language._id } });
    return res.status(201).json({ language });
  } catch (error) { return next(error); }
});
router.put('/:id', admin, manager, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Language not found.' });
    const parsed = languageInput.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Please check the language details.', issues: parsed.error.issues });
    if (!Object.keys(parsed.data).length) return res.status(400).json({ message: 'Provide at least one language field to update.' });
    if (parsed.data.status === 'published' && parsed.data.verification?.status !== 'verified') {
      const existing = await Language.findById(req.params.id);
      if (!existing || (parsed.data.verification?.status || existing.verification?.status) !== 'verified') return res.status(400).json({ message: 'A language must be verified before publication.' });
    }
    const previous = await Language.findById(req.params.id).select('scripts');
    if (!previous) return res.status(404).json({ message: 'Language not found.' });
    if (parsed.data.scripts) {
      parsed.data.scripts = await getPublishedScriptIds(parsed.data.scripts);
      await Script.updateMany({ _id: { $in: previous.scripts } }, { $pull: { languages: previous._id } });
      await Script.updateMany({ _id: { $in: parsed.data.scripts } }, { $addToSet: { languages: previous._id } });
    }
    if (parsed.data.status) parsed.data.isPublished = parsed.data.status === 'published';
    const language = await Language.findByIdAndUpdate(req.params.id, { $set: parsed.data }, { new: true, runValidators: true });
    return res.json({ language });
  } catch (error) { return next(error); }
});
router.post('/:id/varieties', admin, manager, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Language not found.' });
    const schema = z.object({ name: z.string().trim().min(1).max(100), nativeName: z.string().max(100).optional(), description: z.string().max(1500).optional(), regions: z.array(z.string().max(100)).max(30).optional(), alternativeNames: z.array(z.string().max(100)).max(30).optional(), availability: z.enum(availability).optional(), status: z.enum(statuses).optional(), scripts: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(30).optional(), verification: verificationInput.optional() }).strict().safeParse(req.body);
    if (!schema.success) return res.status(400).json({ message: 'Please check the variety details.' });
    const parent = await Language.findById(req.params.id);
    if (!parent) return res.status(404).json({ message: 'Language not found.' });
    if (schema.data.status === 'published' && schema.data.verification?.status !== 'verified') return res.status(400).json({ message: 'A variety must be verified before publication.' });
    if (schema.data.scripts?.length) schema.data.scripts = await getPublishedScriptIds(schema.data.scripts);
    if (schema.data.scripts?.length) {
      const scripts = await Script.find({ _id: { $in: schema.data.scripts } }).select('languages').lean();
      if (scripts.some((script) => !script.languages.some((languageId) => String(languageId) === String(parent._id)))) return res.status(400).json({ message: 'Every variety script must also be associated with its parent language.' });
    }
    const variety = await LanguageVariety.create({ ...schema.data, language: parent._id });
    parent.varieties.addToSet(variety._id); await parent.save();
    return res.status(201).json({ variety });
  } catch (error) { return next(error); }
});

async function getPublishedScriptIds(ids) {
  const scripts = await Script.find({ _id: { $in: ids }, status: 'published', isActive: true }).select('_id').lean();
  if (scripts.length !== new Set(ids).size) throw Object.assign(new Error('Only active published scripts can be associated.'), { status: 400 });
  return scripts.map((script) => script._id);
}
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
export default router;
