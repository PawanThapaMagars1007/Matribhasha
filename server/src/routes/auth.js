import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(254), password: z.string().min(8).max(72) });
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(72) });
function issueToken(user) { return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }); }

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Please check the form.' });
    const { name, email, password } = parsed.data;
    const exists = await User.exists({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    return res.status(201).json({ token: issueToken(user), user });
  } catch (error) { return next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and password.' });
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select('+passwordHash');
    if (!user || user.disabledAt || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ message: 'Email or password was not recognized.' });
    return res.json({ token: issueToken(user), user });
  } catch (error) { return next(error); }
});

router.post('/logout', (_req, res) => res.json({ message: 'Signed out.' }));
router.post('/refresh', (_req, res) => res.status(501).json({ message: 'Refresh tokens are not configured yet.' }));
router.post('/forgot-password', (_req, res) => res.json({ message: 'If an account matches, password reset instructions will be sent when email delivery is configured.' }));
router.post('/reset-password', (_req, res) => res.status(501).json({ message: 'Password reset is not available until email delivery is configured.' }));
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
export default router;
