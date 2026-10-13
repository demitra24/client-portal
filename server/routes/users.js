import { Router } from 'express';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { protect, authorize } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';

const router = Router();
router.use(protect, authorize('admin'));

router.get('/', ah(async (req, res) => {
  const users = await User.find().sort('role name').populate('clientRef', 'company');
  res.json(users);
}));

router.post('/', ah(async (req, res) => {
  const { name, email, password, role = 'member', title = '' } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ message: 'Name, email and a 6+ character password are required' });
  if (role === 'client') return res.status(400).json({ message: 'Create client accounts from the Clients page' });
  try {
    const user = await User.create({ name, email, password, role, title });
    logActivity(req.app.get('io'), { type: 'user', message: `added ${name} to the team as ${role}`, actor: req.user._id });
    res.status(201).json(user);
  } catch (e) {
    e.code === 11000 ? res.status(409).json({ message: 'A user with this email already exists' }) : (() => { throw e; })();
  }
}));

router.patch('/:id', ah(async (req, res) => {
  const { name, title, role, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (name !== undefined) user.name = name;
  if (title !== undefined) user.title = title;
  if (role !== undefined && String(user._id) !== String(req.user._id)) user.role = role; // can't demote yourself
  if (password) {
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    user.password = password;
  }
  await user.save();
  res.json(user);
}));

router.delete('/:id', ah(async (req, res) => {
  if (String(req.params.id) === String(req.user._id))
    return res.status(400).json({ message: 'You cannot remove your own account' });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await Project.updateMany({ team: user._id }, { $pull: { team: user._id } });
  await Task.updateMany({ assignee: user._id }, { assignee: null });
  res.json({ message: 'User removed' });
}));

export default router;