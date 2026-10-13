// project.js — access rules + project loader (all in one file)
import Project from '../models/Project.js';

export const canAccessProject = (user, project) => {
  if (user.role === 'admin') return true;
  if (user.role === 'member') return (project.team || []).some((m) => String(m?._id || m) === String(user._id));
  if (user.role === 'client') return String(project.client?._id || project.client) === String(user.clientRef?._id || user.clientRef);
  return false;
};

export const projectFilter = (user) => {
  if (user.role === 'admin') return {};
  if (user.role === 'member') return { team: user._id };
  return { client: user.clientRef?._id || user.clientRef };
};

export const loadProject = async (req, res, id = req.params.id) => {
  const p = await Project.findById(id)
    .populate('client')
    .populate('team', 'name title email')
    .populate('approvals.requestedBy', 'name')
    .populate('approvals.decidedBy', 'name');
  if (!p) { res.status(404).json({ message: 'Project not found' }); return null; }
  if (!canAccessProject(req.user, p)) { res.status(403).json({ message: 'You do not have access to this project' }); return null; }
  return p;
};