import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Script } from '../models/Script.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
const availability = ['unavailable', 'planned', 'in-development', 'available'];
const scriptInput = z.object({ name: z.string().trim().min(1).max(100), nativeName: z.string().max(100).optional(), description: z.string().max(1500).optional(), unicodeRange: z.string().max(100).optional(), direction: z.enum(['ltr', 'rtl', 'other', 'unknown']).optional(), fontRequirements: z.array(z.string().max(150)).max(20).optional(), languages: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(30).optional(), varieties: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(30).optional(), availability: z.enum(availability).optional(), status: z.enum(['draft', 'under-review', 'published', 'archived']).optional(), isActive: z.boolean().optional(), verification: z.object({ status: z.enum(['unreviewed', 'pending', 'verified', 'needs-review']).optional(), source: z.string().max(1000).optional() }).strict().optional() }).strict();
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1), limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const [scripts, total] = await Promise.all([Script.find({ status: 'published', isActive: true }).select('name nativeName description unicodeRange direction fontRequirements availability').sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(), Script.countDocuments({ status: 'published', isActive: true })]);
    return res.json({ scripts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
});
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Script not found.' });
    const script = await Script.findOne({ _id: req.params.id, status: 'published', isActive: true }).populate({ path: 'languages', match: { status: 'published', isActive: true }, select: 'name nativeName' }).populate({ path: 'varieties', match: { status: 'published', isActive: true }, select: 'name nativeName' }).lean();
    if (!script) return res.status(404).json({ message: 'Script not found.' });
    return res.json({ script });
  } catch (error) { return next(error); }
});
router.post('/', requireAuth, requireRoles('superAdmin', 'languageAdmin', 'languageExpert'), async (req, res, next) => {
  try {
    const parsed = scriptInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Please check the script details.' });
    if (parsed.data.status === 'published' && parsed.data.verification?.status !== 'verified') return res.status(400).json({ message: 'A script must be verified before publication.' });
    if (parsed.data.languages?.length) {
      const languages = await mongoose.model('Language').find({ _id: { $in: parsed.data.languages } }).select('_id').lean();
      if (languages.length !== new Set(parsed.data.languages).size) return res.status(400).json({ message: 'One or more associated languages were not found.' });
    }
    if (parsed.data.varieties?.length) {
      const varieties = await mongoose.model('LanguageVariety').find({ _id: { $in: parsed.data.varieties } }).select('language').lean();
      if (varieties.length !== new Set(parsed.data.varieties).size) return res.status(400).json({ message: 'One or more associated varieties were not found.' });
      if (parsed.data.languages?.length && varieties.some((variety) => !parsed.data.languages.some((languageId) => languageId.toLowerCase() === String(variety.language).toLowerCase()))) return res.status(400).json({ message: 'Each associated variety must belong to one of the associated languages.' });
      parsed.data.languages = [...new Set([...(parsed.data.languages || []), ...varieties.map((variety) => String(variety.language))])];
    }
    const script = await Script.create(parsed.data);
    if (script.languages.length) await mongoose.model('Language').updateMany({ _id: { $in: script.languages } }, { $addToSet: { scripts: script._id } });
    if (script.varieties.length) await mongoose.model('LanguageVariety').updateMany({ _id: { $in: script.varieties } }, { $addToSet: { scripts: script._id } });
    return res.status(201).json({ script });
  } catch (error) { return next(error); }
});
router.put('/:id', requireAuth, requireRoles('superAdmin', 'languageAdmin', 'languageExpert'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Script not found.' });
    const parsed = scriptInput.partial().safeParse(req.body);
    if (!parsed.success || !Object.keys(parsed.data || {}).length) return res.status(400).json({ message: 'Please provide valid script details to update.' });
    const current = await Script.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Script not found.' });
    if (parsed.data.status === 'published' && (parsed.data.verification?.status || current.verification?.status) !== 'verified') return res.status(400).json({ message: 'A script must be verified before publication.' });
    if (parsed.data.languages?.length) {
      const languages = await mongoose.model('Language').find({ _id: { $in: parsed.data.languages } }).select('_id').lean();
      if (languages.length !== new Set(parsed.data.languages).size) return res.status(400).json({ message: 'One or more associated languages were not found.' });
    }
    if (parsed.data.varieties?.length) {
      const varieties = await mongoose.model('LanguageVariety').find({ _id: { $in: parsed.data.varieties } }).select('language').lean();
      if (varieties.length !== new Set(parsed.data.varieties).size) return res.status(400).json({ message: 'One or more associated varieties were not found.' });
      const languageIds = parsed.data.languages || current.languages.map(String);
      if (varieties.some((variety) => !languageIds.some((languageId) => languageId.toLowerCase() === String(variety.language).toLowerCase()))) return res.status(400).json({ message: 'Each associated variety must belong to an associated language.' });
      parsed.data.languages = [...new Set([...languageIds, ...varieties.map((variety) => String(variety.language))])];
    }
    if (parsed.data.languages) {
      await mongoose.model('Language').updateMany({ _id: { $in: current.languages } }, { $pull: { scripts: current._id } });
      await mongoose.model('Language').updateMany({ _id: { $in: parsed.data.languages } }, { $addToSet: { scripts: current._id } });
    }
    if (parsed.data.varieties) {
      await mongoose.model('LanguageVariety').updateMany({ _id: { $in: current.varieties } }, { $pull: { scripts: current._id } });
      await mongoose.model('LanguageVariety').updateMany({ _id: { $in: parsed.data.varieties } }, { $addToSet: { scripts: current._id } });
    }
    const script = await Script.findByIdAndUpdate(current._id, { $set: parsed.data }, { new: true, runValidators: true });
    return res.json({ script });
  } catch (error) { return next(error); }
});
export default router;
