// activity.js — writes an activity row and pushes it live over Socket.IO
import Activity from '../models/Activity.js';

export const logActivity = async (io, { type, message, actor, project }) => {
  try {
    let doc = await Activity.create({ type, message, actor, project });
    doc = await doc.populate('actor', 'name role');
    if (io) {
      io.emit('activity:new', doc);                                   // global live feed
      if (project) io.to(`project:${project}`).emit('project:refresh', { projectId: String(project) });
    }
    return doc;
  } catch (e) { console.error('activity log failed:', e.message); }
};