import { Router } from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import File from '../models/File.js';
import Activity from '../models/Activity.js';
import Client from '../models/Client.js';
import { protect } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { projectFilter, loadProject } from '../utils/project.js';

const router = Router();

const progressAgg = (ids) => Task.aggregate([
  { $match: { project: { $in: ids } } },
  { $group: {
    _id: '$project', total: { $sum: 1 },
    done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
    overdue: { $sum: { $cond: [{ $and: [{ $ne: ['$dueDate', null] }, { $lt: ['$dueDate', new Date()] }, { $ne: ['$status', 'done'] }] }, 1, 0] } },
  } },
]);

router.get('/stats', protect, ah(async (req, res) => {
  const user = req.user;
  const projects = await Project.find(projectFilter(user))
    .populate('client', 'company').populate('team', 'name title').sort('deadline');
  const ids = projects.map((p) => p._id);
  const map = Object.fromEntries((await progressAgg(ids)).map((a) => [String(a._id), a]));
  const withProgress = projects.map((p) => {
    const c = map[String(p._id)] || { total: 0, done: 0, overdue: 0 };
    return { ...p.toObject(), total: c.total, done: c.done, overdue: c.overdue, progress: c.total ? Math.round((c.done / c.total) * 100) : 0 };
  });

  const now = new Date(); const week = new Date(Date.now() + 7 * 864e5);
  const totalTasks = withProgress.reduce((s, p) => s + p.total, 0);
  const doneTasks = withProgress.reduce((s, p) => s + p.done, 0);
  const [openTasks, dueWeek] = await Promise.all([
    Task.countDocuments({ project: { $in: ids }, status: { $ne: 'done' } }),
    Task.countDocuments({ project: { $in: ids }, status: { $ne: 'done' }, dueDate: { $gte: now, $lte: week } }),
  ]);
  const pendingApprovals = withProgress.reduce((s, p) => s + p.approvals.filter((a) => a.status === 'pending').length, 0);

  let myTasks, myDoneTasks, approvalsPending, recentFiles;
  if (user.role === 'member') {
    // open tasks + recently completed (so a mistaken "done" can be undone)
    [myTasks, myDoneTasks] = await Promise.all([
      Task.find({ assignee: user._id, status: { $ne: 'done' } })
        .populate('assignee', 'name title').populate('project', 'name code').sort({ dueDate: 1 }).limit(8).lean(),
      Task.find({ assignee: user._id, status: 'done' })
        .populate('assignee', 'name title').populate('project', 'name code').sort('-updatedAt').limit(5).lean(),
    ]);
  }
  if (user.role === 'client') {
    approvalsPending = withProgress
      .filter((p) => p.approvals.some((a) => a.status === 'pending'))
      .map((p) => ({ project: { _id: p._id, name: p.name, code: p.code }, approval: p.approvals.find((a) => a.status === 'pending') }));
    recentFiles = await File.find({ project: { $in: ids } }).sort('-createdAt').limit(5)
      .populate('uploader', 'name').populate('project', 'name').lean();
  }
  const activity = await Activity.find({ project: { $in: ids } }).sort('-createdAt').limit(12).populate('actor', 'name role').lean();

  res.json({
    role: user.role,
    stats: {
      projects: withProgress.length,
      activeProjects: withProgress.filter((p) => p.status === 'active').length,
      clients: user.role === 'admin' ? await Client.countDocuments() : undefined,
      openTasks, overdue: withProgress.reduce((s, p) => s + p.overdue, 0),
      dueWeek, pendingApprovals,
      completion: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
    },
    projects: withProgress,
    deadlines: withProgress.filter((p) => p.deadline && p.status !== 'completed').slice(0, 5),
    activity, myTasks, myDoneTasks, approvalsPending, recentFiles,
  });
}));

router.get('/activity', protect, ah(async (req, res) => {
  let filter = {};
  if (req.query.project) {
    const p = await loadProject(req, res, req.query.project);
    if (!p) return;
    filter.project = p._id;
  } else if (req.user.role !== 'admin') {
    const ids = (await Project.find(projectFilter(req.user)).select('_id')).map((d) => d._id);
    filter.project = { $in: ids };
  }
  const items = await Activity.find(filter).sort('-createdAt').limit(Number(req.query.limit) || 50).populate('actor', 'name role').lean();
  res.json(items);
}));

export default router;