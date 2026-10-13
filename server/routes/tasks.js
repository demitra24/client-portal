import { Router } from 'express';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { loadProject, projectFilter } from '../utils/project.js';
import { logActivity } from '../utils/activity.js';

const router = Router();
const io = () => global.io;
const LABELS = { todo: 'To do', 'in-progress': 'In progress', review: 'In review', done: 'Done' };

router.get('/', protect, ah(async (req, res) => {
  const { project, mine } = req.query;
  if (project) {
    const p = await loadProject(req, res, project);
    if (!p) return;
    const tasks = await Task.find({ project: p._id }).populate('assignee', 'name title').sort('createdAt');
    return res.json(tasks);
  }
  if (mine === '1') {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate('assignee', 'name title').populate('project', 'name code').sort({ dueDate: 1 });
    return res.json(tasks);
  }
  if (req.user.role === 'admin')
    return res.json(await Task.find().populate('assignee', 'name title').populate('project', 'name code').limit(200));
  const ids = (await (await import('../models/Project.js')).default.find(projectFilter(req.user)).select('_id')).map((d) => d._id);
  res.json(await Task.find({ project: { $in: ids } }).populate('assignee', 'name title').populate('project', 'name code'));
}));

router.post('/', protect, ah(async (req, res) => {
  if (req.user.role === 'client')
    return res.status(403).json({ message: 'Clients cannot create tasks — leave feedback in the discussion tab instead' });
  const p = await loadProject(req, res, req.body.project);
  if (!p) return;
  if (!req.body.title?.trim()) return res.status(400).json({ message: 'Task title is required' });
  let task = await Task.create({
    title: req.body.title.trim(), description: req.body.description || '',
    project: p._id, assignee: req.body.assignee || null,
    status: req.body.status || 'todo', priority: req.body.priority || 'medium',
    dueDate: req.body.dueDate || null,
  });
  task = await task.populate('assignee', 'name title');
  io().to(`project:${p._id}`).emit('task:update', task);
  logActivity(io(), { type: 'task', message: `added task “${task.title}”`, actor: req.user._id, project: p._id });
  res.status(201).json(task);
}));

router.patch('/:id', protect, ah(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  const p = await loadProject(req, res, task.project);
  if (!p) return;
  if (req.user.role === 'client')
    return res.status(403).json({ message: 'Clients cannot modify tasks — leave feedback in the discussion tab instead' });
  const prevStatus = task.status;
  ['title', 'description', 'status', 'priority'].forEach((k) => { if (req.body[k] !== undefined) task[k] = req.body[k]; });
  if ('dueDate' in req.body) task.dueDate = req.body.dueDate || null;
  if ('assignee' in req.body) task.assignee = req.body.assignee || null;
  await task.save();
  await task.populate('assignee', 'name title');
  io().to(`project:${p._id}`).emit('task:update', task); // instant board update for everyone in the project
  logActivity(io(), {
    type: 'task',
    message: req.body.status && req.body.status !== prevStatus
      ? `moved “${task.title}” to ${LABELS[task.status]}`
      : `updated task “${task.title}”`,
    actor: req.user._id, project: p._id,
  });
  res.json(task);
}));

router.delete('/:id', protect, ah(async (req, res) => {
  if (req.user.role === 'client') return res.status(403).json({ message: 'Clients cannot delete tasks' });
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  const p = await loadProject(req, res, task.project);
  if (!p) return;
  await task.deleteOne();
  logActivity(io(), { type: 'task', message: `deleted task “${task.title}”`, actor: req.user._id, project: p._id });
  res.json({ message: 'Task deleted' });
}));

export default router;