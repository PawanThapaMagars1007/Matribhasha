import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Language } from '../models/Language.js';
import { LanguageVariety } from '../models/LanguageVariety.js';

const router = Router();
router.use(requireAuth);
router.get('/profile', (req, res) => res.json({ user: req.user }));
router.get('/languages', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('preferences.nativeLanguages', 'name nativeName').populate('preferences.knownLanguages', 'name nativeName').populate('preferences.learningLanguages', 'name nativeName').populate('preferences.preferredVarieties.variety', 'name nativeName').lean();
    return res.json({ preferences: user.preferences });
  } catch (error) { return next(error); }
});
router.put('/languages', async (req, res, next) => {
  try {
    const ids = z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(30);
    const parsed = z.object({ nativeLanguages: ids.optional(), knownLanguages: ids.optional(), learningLanguages: ids.optional(), preferredVarieties: z.array(z.object({ language: z.string().regex(/^[a-f\d]{24}$/i), variety: z.string().regex(/^[a-f\d]{24}$/i) }).strict()).max(30).optional(), interfaceLanguage: z.string().trim().min(2).max(20).optional() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Please check your language selections.' });
    const data = parsed.data;
    const languageIds = [...new Set([...data.nativeLanguages || [], ...data.knownLanguages || [], ...data.learningLanguages || [], ...(data.preferredVarieties || []).map((item) => item.language)])];
    if (languageIds.length) {
      const found = await Language.find({ _id: { $in: languageIds }, $and: [{ $or: [{ isActive: true }, { isActive: { $exists: false } }] }, { $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }] }).select('_id').lean();
      if (found.length !== languageIds.length) return res.status(400).json({ message: 'One or more selected languages are no longer available.' });
    }
    if (data.preferredVarieties?.length) {
      const pairs = await Promise.all(data.preferredVarieties.map(async ({ language, variety }) => LanguageVariety.exists({ _id: variety, language, isActive: true, status: 'published' })));
      if (pairs.some((pair) => !pair)) return res.status(400).json({ message: 'Each preferred variety must belong to its selected published language.' });
    }
    for (const key of ['nativeLanguages', 'knownLanguages', 'learningLanguages']) if (data[key]) data[key] = [...new Set(data[key])];
    if (data.preferredVarieties) data.preferredVarieties = [...new Map(data.preferredVarieties.map((item) => [item.language, item])).values()];
    for (const [key, value] of Object.entries(data)) req.user.set(`preferences.${key}`, value);
    await req.user.save();
    return res.json({ user: req.user });
  } catch (error) { return next(error); }
});
router.put('/profile', async (req, res, next) => {
  try {
    const parsed = z.object({ name: z.string().trim().min(2).max(80).optional(), username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,30}$/).optional(), profilePicture: z.string().url().max(500).optional() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Please check your profile details.' });
    Object.assign(req.user, parsed.data);
    await req.user.save();
    return res.json({ user: req.user });
  } catch (error) { return next(error); }
});
router.put('/preferences', async (req, res, next) => {
  try {
    const parsed = z.object({ interfaceLanguage: z.string().min(2).max(20).optional(), knownLanguages: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(30).optional(), learningLanguages: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(30).optional(), proficiencyLevel: z.enum(['beginner', 'elementary', 'intermediate', 'advanced']).optional(), learningPreferences: z.array(z.enum(['reading', 'listening', 'speaking', 'writing', 'games'])).max(5).optional(), dailyGoalMinutes: z.number().int().min(5).max(180).optional() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Please check your learning preferences.' });
    const selectedIds = [...new Set([...(parsed.data.knownLanguages || []), ...(parsed.data.learningLanguages || [])])];
    if (selectedIds.length) {
      const available = await Language.find({ _id: { $in: selectedIds }, $and: [{ $or: [{ isActive: true }, { isActive: { $exists: false } }] }, { $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }] }).select('_id').lean();
      if (available.length !== selectedIds.length) return res.status(400).json({ message: 'One or more selected languages are no longer available.' });
    }
    for (const [key, value] of Object.entries(parsed.data)) req.user.set(`preferences.${key}`, value);
    await req.user.save();
    return res.json({ user: req.user });
  } catch (error) { return next(error); }
});
export default router;
