import { Router } from 'express';
import mongoose from 'mongoose';
import { Language } from '../models/Language.js';

const router = Router();
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const q = String(req.query.q || '').trim();
    const filter = { isPublished: true };
    if (q) filter.$or = [{ name: new RegExp(escapeRegex(q), 'i') }, { nativeName: new RegExp(escapeRegex(q), 'i') }, { alternativeNames: new RegExp(escapeRegex(q), 'i') }];
    const [languages, total] = await Promise.all([Language.find(filter).select('name nativeName alternativeNames description scripts verification audioAvailable').populate('scripts', 'name nativeName').sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(), Language.countDocuments(filter)]);
    return res.json({ languages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
});
router.get('/:id', async (req, res, next) => {
  try { if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Language not found.' }); const language = await Language.findOne({ _id: req.params.id, isPublished: true }).populate('scripts', 'name nativeName').lean(); if (!language) return res.status(404).json({ message: 'Language not found.' }); return res.json({ language }); } catch (error) { return next(error); }
});
router.get('/:id/varieties', async (_req, res) => res.json({ varieties: [] }));
router.get('/:id/scripts', async (_req, res) => res.json({ scripts: [] }));
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
export default router;
