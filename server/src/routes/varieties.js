import { Router } from 'express';
import mongoose from 'mongoose';
import { LanguageVariety } from '../models/LanguageVariety.js';
import { Language } from '../models/Language.js';
import { Script } from '../models/Script.js';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
const editable = requireAuth, manager = requireRoles('superAdmin', 'languageAdmin', 'languageExpert', 'reviewer');
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const filter = { status: 'published', isActive: true };
    if (req.query.language && mongoose.isValidObjectId(req.query.language)) filter.language = req.query.language;
    const [varieties, total] = await Promise.all([LanguageVariety.find(filter).populate({ path: 'language', match: { status: 'published', isActive: true }, select: 'name nativeName' }).populate({ path: 'scripts', match: { status: 'published', isActive: true }, select: 'name nativeName direction' }).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(), LanguageVariety.countDocuments(filter)]);
    return res.json({ varieties: varieties.filter((item) => item.language), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
});
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Variety not found.' });
    const variety = await LanguageVariety.findOne({ _id: req.params.id, status: 'published', isActive: true }).populate('language', 'name nativeName').populate({ path: 'scripts', match: { status: 'published', isActive: true } }).lean();
    if (!variety?.language) return res.status(404).json({ message: 'Variety not found.' });
    return res.json({ variety });
  } catch (error) { return next(error); }
});
router.put('/:id', editable, manager, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Variety not found.' });
    const parsed = z.object({ name: z.string().trim().min(1).max(100).optional(), nativeName: z.string().max(100).optional(), description: z.string().max(1500).optional(), regions: z.array(z.string().max(100)).max(30).optional(), alternativeNames: z.array(z.string().max(100)).max(30).optional(), availability: z.enum(['unavailable', 'planned', 'in-development', 'available']).optional(), status: z.enum(['draft', 'under-review', 'published', 'archived']).optional(), isActive: z.boolean().optional(), scripts: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(30).optional(), verification: z.object({ status: z.enum(['unreviewed', 'pending', 'verified', 'needs-review']).optional(), source: z.string().max(1000).optional() }).strict().optional() }).strict().safeParse(req.body);
    if (!parsed.success || !Object.keys(parsed.data || {}).length) return res.status(400).json({ message: 'Please provide valid variety details to update.' });
    const current = await LanguageVariety.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Variety not found.' });
    if (parsed.data.status === 'published' && (parsed.data.verification?.status || current.verification?.status) !== 'verified') return res.status(400).json({ message: 'A variety must be verified before publication.' });
    if (parsed.data.scripts) {
      const scripts = await Script.find({ _id: { $in: parsed.data.scripts }, status: 'published', isActive: true }).select('_id languages').lean();
      if (scripts.length !== new Set(parsed.data.scripts).size) return res.status(400).json({ message: 'Only active published scripts can be associated.' });
      if (scripts.some((script) => !script.languages.some((languageId) => String(languageId) === String(current.language)))) return res.status(400).json({ message: 'Each variety script must also be associated with its parent language.' });
      await Script.updateMany({ _id: { $in: current.scripts } }, { $pull: { varieties: current._id } });
      await Script.updateMany({ _id: { $in: parsed.data.scripts } }, { $addToSet: { varieties: current._id } });
    }
    const variety = await LanguageVariety.findByIdAndUpdate(current._id, { $set: parsed.data }, { new: true, runValidators: true });
    return res.json({ variety });
  } catch (error) { return next(error); }
});
export default router;
