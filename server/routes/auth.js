import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';

const router = Router();
const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret-change-me', { expiresIn: process.env.JWT_EXPIRES || '7d' });

router.post('/login', ah(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('clientRef');
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: sign(user._id), user });
}));

router.get('/me', protect, (req, res) => res.json(req.user));

export default router;