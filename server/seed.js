import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Client from './models/Client.js';
import Project from './models/Project.js';
import Task from './models/Task.js';
import Comment from './models/Comment.js';
import File from './models/File.js';
import Activity from './models/Activity.js';

const d = (n) => new Date(Date.now() + n * 864e5);   // n days from now
const h = (n) => new Date(Date.now() + n * 36e5);    // n hours from now

async function seed() {
  await connectDB();
  console.log('Clearing existing data…');
  await Promise.all([
    User.deleteMany({}), Client.deleteMany({}), Project.deleteMany({}),
    Task.deleteMany({}), Comment.deleteMany({}), File.deleteMany({}), Activity.deleteMany({}),
  ]);

  console.log('Creating team & admin…');
  const admin = await User.create({ name: 'Maya Okonkwo', email: 'admin@portal.io', password: 'admin123', role: 'admin', title: 'Studio Director' });
  const daniel = await User.create({ name: 'Daniel Reyes', email: 'daniel@portal.io', password: 'member123', role: 'member', title: 'Senior Developer' });
  const priya  = await User.create({ name: 'Priya Sharma', email: 'priya@portal.io', password: 'member123', role: 'member', title: 'Design Lead' });
  const tomas  = await User.create({ name: 'Tomas Lindqvist', email: 'tomas@portal.io', password: 'member123', role: 'member', title: 'Full-stack Developer' });

  console.log('Creating clients + portal logins…');
  const halstead  = await Client.create({ company: 'Halstead & Co', contactName: 'Clara Halstead', email: 'clara@halstead.io', phone: '+1 415 555 0134', address: '660 Bryant St, San Francisco' });
  const northwind = await Client.create({ company: 'Northwind Labs', contactName: 'Leo Tanaka', email: 'leo@northwind.io', phone: '+1 206 555 0180', address: '1201 2nd Ave, Seattle' });
  const clara = await User.create({ name: 'Clara Halstead', email: 'clara@halstead.io', password: 'client123', role: 'client', title: 'Marketing Director', clientRef: halstead._id });
  const leo   = await User.create({ name: 'Leo Tanaka', email: 'leo@northwind.io', password: 'client123', role: 'client', title: 'Head of Product', clientRef: northwind._id });
  halstead.portalUser = clara._id; await halstead.save();
  northwind.portalUser = leo._id; await northwind.save();

  console.log('Creating projects…');
  const p1 = await Project.create({ name: 'Halstead Brand System', code: 'HLD-01', client: halstead._id, description: 'Full identity refresh — logo, typography, guidelines and launch collateral.', status: 'active', deadline: d(21), budget: 28000, team: [priya._id, daniel._id], createdBy: admin._id });
  const p2 = await Project.create({ name: 'Northwind Web Platform', code: 'NWL-02', client: northwind._id, description: 'Customer portal web app — auth, dashboards, billing and realtime notifications.', status: 'active', deadline: d(45), budget: 64000, team: [daniel._id, tomas._id], createdBy: admin._id });
  const p3 = await Project.create({ name: 'Halstead Campaign Microsite', code: 'HLD-02', client: halstead._id, description: 'Single-page launch site for the autumn campaign with animation and CMS copy.', status: 'review', deadline: d(9), budget: 15000, team: [priya._id], createdBy: admin._id });
  const p4 = await Project.create({ name: 'Northwind Design Refresh', code: 'NWL-01', client: northwind._id, description: 'UI refresh of the marketing site and design-system components.', status: 'planning', deadline: d(63), budget: 22000, team: [tomas._id, priya._id], createdBy: admin._id });

  console.log('Creating tasks…');
  const T = (project, title, status, assignee, due, priority = 'medium', description = '') =>
    ({ project, title, status, assignee, dueDate: due, priority, description });
  const tasks = await Task.create([
    T(p1._id, 'Stakeholder discovery workshop', 'done', priya._id, d(-12), 'high', 'Interviews with founders, sales and marketing.'),
    T(p1._id, 'Competitive audit', 'done', priya._id, d(-8)),
    T(p1._id, 'Moodboard — three directions', 'in-progress', priya._id, d(2), 'high', 'Present A/B/C directions for the identity.'),
    T(p1._id, 'Logo concept rounds', 'todo', priya._id, d(6)),
    T(p1._id, 'Typography & colour system', 'todo', daniel._id, d(8)),
    T(p1._id, 'Brand guidelines draft', 'todo', priya._id, d(14), 'low'),
    T(p2._id, 'Database schema & models', 'done', daniel._id, d(-15)),
    T(p2._id, 'Auth service (JWT + sessions)', 'done', daniel._id, d(-6)),
    T(p2._id, 'Client dashboard REST API', 'in-progress', daniel._id, d(3), 'high'),
    T(p2._id, 'Realtime notifications (socket layer)', 'in-progress', tomas._id, d(5)),
    T(p2._id, 'QA pass on staging', 'review', tomas._id, d(1), 'high'),
    T(p2._id, 'CI/CD deployment pipeline', 'todo', daniel._id, d(12), 'low'),
    T(p3._id, 'Landing page build', 'done', priya._id, d(-5)),
    T(p3._id, 'Hero animation pass', 'review', priya._id, d(1), 'high', 'Timeline + easing polish on scroll.'),
    T(p3._id, 'CMS copy integration', 'in-progress', priya._id, d(-2)),
    T(p3._id, 'Final QA & launch checklist', 'todo', priya._id, d(5)),
    T(p4._id, 'Heuristic evaluation', 'in-progress', tomas._id, d(4)),
    T(p4._id, 'Component inventory', 'todo', priya._id, d(9)),
    T(p4._id, 'Accessibility audit (WCAG AA)', 'todo', tomas._id, d(14), 'low'),
  ]);
  console.log(`  ${tasks.length} tasks created`);

  console.log('Creating comments…');
  await Comment.create([
    { project: p3._id, author: clara._id, body: 'Love the direction of the hero. Could we try a calmer easing on the scroll sections?', createdAt: h(-30) },
    { project: p3._id, author: priya._id, body: 'Absolutely — pushing a softer easing curve to staging today.', createdAt: h(-26) },
    { project: p1._id, author: admin._id, body: 'Kickoff notes are in the shared drive. Priya owns direction A, Daniel supports the system build.', createdAt: h(-70) },
    { project: p2._id, author: leo._id, body: 'Staging looks solid. Billing edge cases are noted in the doc — please prioritise those.', createdAt: h(-8) },
  ]);

  console.log('Creating approvals…');
  await Project.findByIdAndUpdate(p3._id, { $push: { approvals: { title: 'Design sign-off', status: 'pending', requestedBy: admin._id, requestedAt: h(-20) } } });
  await Project.findByIdAndUpdate(p1._id, { $push: { approvals: { title: 'Discovery phase', status: 'approved', feedback: 'Great workshop — aligned on direction A.', requestedBy: priya._id, decidedBy: clara._id, requestedAt: h(-140), decidedAt: h(-120) } } });

  console.log('Creating activity…');
  await Activity.create([
    { type: 'project', actor: admin._id, project: p4._id, message: 'created project “Northwind Design Refresh”', createdAt: h(-90) },
    { type: 'task', actor: priya._id, project: p1._id, message: 'moved “Moodboard — three directions” to In progress', createdAt: h(-50) },
    { type: 'comment', actor: clara._id, project: p3._id, message: 'commented on “Halstead Campaign Microsite”', createdAt: h(-30) },
    { type: 'file', actor: daniel._id, project: p2._id, message: 'uploaded “API-spec-v2.pdf” to “Northwind Web Platform”', createdAt: h(-24) },
    { type: 'approval', actor: admin._id, project: p3._id, message: 'requested approval — “Design sign-off”', createdAt: h(-20) },
    { type: 'task', actor: tomas._id, project: p2._id, message: 'moved “QA pass on staging” to In review', createdAt: h(-9) },
    { type: 'comment', actor: leo._id, project: p2._id, message: 'commented on “Northwind Web Platform”', createdAt: h(-8) },
    { type: 'task', actor: daniel._id, project: p2._id, message: 'moved “Auth service (JWT + sessions)” to Done', createdAt: h(-5) },
  ]);

  console.log('\n✔ Seed complete — demo accounts:\n');
  console.table([
    { role: 'Admin', email: 'admin@portal.io', password: 'admin123' },
    { role: 'Team member', email: 'daniel@portal.io', password: 'member123' },
    { role: 'Team member', email: 'priya@portal.io', password: 'member123' },
    { role: 'Client', email: 'clara@halstead.io', password: 'client123' },
    { role: 'Client', email: 'leo@northwind.io', password: 'client123' },
  ]);
  await mongoose.disconnect();
}
seed().catch((e) => { console.error(e); process.exit(1); });