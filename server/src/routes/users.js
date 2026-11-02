import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();
router.use(requireAuth);
router.get('/profile', (req, res) => res.json({ user: req.user }));
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
    for (const [key, value] of Object.entries(parsed.data)) req.user.set(`preferences.${key}`, value);
    await req.user.save();
    return res.json({ user: req.user });
  } catch (error) { return next(error); }
});
export default router;
