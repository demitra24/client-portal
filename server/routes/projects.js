import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import File from '../models/File.js';
import Activity from '../models/Activity.js';
import { protect, authorize } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { loadProject, projectFilter } from '../utils/project.js';
import { logActivity } from '../utils/activity.js';

const router = Router();
const io = () => global.io;

/* ---------- multipart upload setup (files land in /server/uploads) ---------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

/* ---------------------------------- list ---------------------------------- */
router.get('/', protect, ah(async (req, res) => {
  const projects = await Project.find(projectFilter(req.user))
    .populate('client', 'company').populate('team', 'name title').sort('-updatedAt');
  const agg = await Task.aggregate([
    { $match: { project: { $in: projects.map((p) => p._id) } } },
    { $group: {
      _id: '$project', total: { $sum: 1 },
      done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
      overdue: { $sum: { $cond: [{ $and: [{ $ne: ['$dueDate', null] }, { $lt: ['$dueDate', new Date()] }, { $ne: ['$status', 'done'] }] }, 1, 0] } },
    } },
  ]);
  const map = Object.fromEntries(agg.map((a) => [String(a._id), a]));
  res.json(projects.map((p) => {
    const c = map[String(p._id)] || { total: 0, done: 0, overdue: 0 };
    return { ...p.toObject(), total: c.total, done: c.done, overdue: c.overdue, progress: c.total ? Math.round((c.done / c.total) * 100) : 0 };
  }));
}));

/* --------------------------------- create --------------------------------- */
router.post('/', protect, authorize('admin'), ah(async (req, res) => {
  const { name, code, client, description = '', status = 'planning', deadline, budget = 0, team = [] } = req.body;
  if (!name || !client) return res.status(400).json({ message: 'Project name and client are required' });
  const project = await Project.create({
    name, code: code || `${name.slice(0, 3).toUpperCase()}-${String(Date.now()).slice(-2)}`,
    client, description, status, deadline: deadline || null, budget, team, createdBy: req.user._id,
  });
  await project.populate([{ path: 'client', select: 'company' }, { path: 'team', select: 'name title' }]);
  logActivity(io(), { type: 'project', message: `created project “${name}”`, actor: req.user._id, project: project._id });
  res.status(201).json(project);
}));

/* --------------------------------- detail --------------------------------- */
router.get('/:id', protect, ah(async (req, res) => {
  const p = await loadProject(req, res);
  if (!p) return;
  res.json(p);
}));

router.patch('/:id', protect, authorize('admin', 'member'), ah(async (req, res) => {
  const p = await loadProject(req, res);
  if (!p) return;
  ['name', 'code', 'description', 'status', 'deadline', 'budget', 'team'].forEach((k) => {
    if (req.body[k] !== undefined) p[k] = req.body[k];
  });
  await p.save();
  await p.populate([{ path: 'client', select: 'company' }, { path: 'team', select: 'name title' }]);
  if (req.body.status)
    logActivity(io(), { type: 'project', message: `set “${p.name}” to ${req.body.status}`, actor: req.user._id, project: p._id });
  res.json(p);
}));

router.delete('/:id', protect, authorize('admin'), ah(async (req, res) => {
  const p = await loadProject(req, res);
  if (!p) return;
  const files = await File.find({ project: p._id });
  files.forEach((f) => fs.unlink(path.join(uploadDir, f.filename), () => {}));
  await Promise.all([
    Task.deleteMany({ project: p._id }), Comment.deleteMany({ project: p._id }),
    File.deleteMany({ project: p._id }), Activity.deleteMany({ project: p._id }), p.deleteOne(),
  ]);
  res.json({ message: 'Project deleted' });
}));

/* -------------------------------- comments -------------------------------- */
router.get('/:id/comments', protect, ah(async (req, res) => {
  const p = await loadProject(req, res);
  if (!p) return;
  res.json(await Comment.find({ project: p._id }).populate('author', 'name role').sort('createdAt'));
}));

router.post('/:id/comments', protect, ah(async (req, res) => {
  const p = await loadProject(req, res);
  if (!p) return;
  const body = (req.body.body || '').trim();
  if (!body) return res.status(400).json({ message: 'Comment cannot be empty' });
  let c = await Comment.create({ project: p._id, author: req.user._id, body });
  c = await c.populate('author', 'name role');
  logActivity(io(), { type: 'comment', message: `commented on “${p.name}”`, actor: req.user._id, project: p._id });
  res.status(201).json(c);
}));

/* ---------------------------------- files --------------------------------- */
router.get('/:id/files', protect, ah(async (req, res) => {
  const p = await loadProject(req, res);
  if (!p) return;
  const files = await File.find({ project: p._id }).populate('uploader', 'name').sort('-createdAt').lean();
  res.json(files.map((f) => ({ ...f, url: `/uploads/${f.filename}` })));
}));

router.post('/:id/files', protect, upload.single('file'), ah(async (req, res) => {
  const p = await loadProject(req, res);
  if (!p) return;
  if (!req.file) return res.status(400).json({ message: 'No file received' });
  let f = await File.create({
    project: p._id, uploader: req.user._id,
    originalName: req.file.originalname, filename: req.file.filename,
    mime: req.file.mimetype, size: req.file.size,
  });
  f = await f.populate('uploader', 'name');
  logActivity(io(), { type: 'file', message: `uploaded “${req.file.originalname}” to “${p.name}”`, actor: req.user._id, project: p._id });
  res.status(201).json({ ...f.toObject(), url: `/uploads/${f.filename}` });
}));

router.get('/:id/files/:fid/download', protect, ah(async (req, res) => {
  const p = await loadProject(req, res);
  if (!p) return;
  const f = await File.findOne({ _id: req.params.fid, project: p._id });
  if (!f) return res.status(404).json({ message: 'File not found' });
  res.download(path.join(uploadDir, f.filename), f.originalName);
}));

router.delete('/:id/files/:fid', protect, ah(async (req, res) => {
  const p = await loadProject(req, res);
  if (!p) return;
  const f = await File.findOne({ _id: req.params.fid, project: p._id });
  if (!f) return res.status(404).json({ message: 'File not found' });
  const mayDelete = req.user.role !== 'client' || String(f.uploader) === String(req.user._id);
  if (!mayDelete) return res.status(403).json({ message: 'Clients can only remove files they uploaded' });
  fs.unlink(path.join(uploadDir, f.filename), () => {});
  await f.deleteOne();
  res.json({ message: 'File removed' });
}));

/* -------------------------------- approvals -------------------------------- */
router.post('/:id/approvals', protect, authorize('admin', 'member'), ah(async (req, res) => {
  const p = await loadProject(req, res);
  if (!p) return;
  if (p.approvals.some((a) => a.status === 'pending'))
    return res.status(400).json({ message: 'An approval is already pending for this project' });
  const title = (req.body.title || '').trim() || 'Delivery sign-off';
  p.approvals.push({ title, requestedBy: req.user._id, requestedAt: new Date() });
  await p.save();
  logActivity(io(), { type: 'approval', message: `requested approval — “${title}”`, actor: req.user._id, project: p._id });
  res.status(201).json(p);
}));

router.patch('/:id/approvals/:aid', protect, ah(async (req, res) => {
  const p = await loadProject(req, res);
  if (!p) return;
  const a = p.approvals.id(req.params.aid);
  if (!a) return res.status(404).json({ message: 'Approval not found' });
  if (a.status !== 'pending') return res.status(400).json({ message: 'This approval was already decided' });
  if (req.user.role !== 'client') return res.status(403).json({ message: 'Only the client can decide an approval' });
  const { decision, feedback = '' } = req.body;
  if (!['approved', 'changes'].includes(decision))
    return res.status(400).json({ message: 'Decision must be "approved" or "changes"' });
  a.status = decision; a.feedback = feedback; a.decidedBy = req.user._id; a.decidedAt = new Date();
  await p.save();
  logActivity(io(), {
    type: 'approval',
    message: decision === 'approved' ? `approved “${a.title}”` : `requested changes on “${a.title}”`,
    actor: req.user._id, project: p._id,
  });
  res.json(p);
}));

export default router;