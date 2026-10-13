import { Router } from 'express';
import Client from '../models/Client.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { protect, authorize } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';

const router = Router();
router.use(protect, authorize('admin'));

// creates the linked portal login for a client company
const attachPortalLogin = async (client, contactName, email, password) => {
  const u = await User.create({ name: contactName, email, password, role: 'client', title: 'Client' });
  u.clientRef = client._id; await u.save();
  client.portalUser = u._id; await client.save();
};

router.get('/', ah(async (req, res) => {
  const clients = await Client.find().sort('company').populate('portalUser', 'name email');
  const counts = await Project.aggregate([{ $group: { _id: '$client', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json(clients.map((c) => ({ ...c.toObject(), projectCount: map[String(c._id)] || 0 })));
}));

router.post('/', ah(async (req, res) => {
  const { company, contactName, email, phone = '', address = '', createLogin, loginEmail, loginPassword } = req.body;
  if (!company || !contactName || !email) return res.status(400).json({ message: 'Company, contact name and email are required' });
  const client = await Client.create({ company, contactName, email, phone, address });
  if (createLogin && loginEmail && loginPassword && loginPassword.length >= 6)
    await attachPortalLogin(client, contactName, loginEmail, loginPassword);
  logActivity(req.app.get('io'), { type: 'user', message: `onboarded client “${company}”`, actor: req.user._id });
  res.status(201).json(client);
}));

router.patch('/:id', ah(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  ['company', 'contactName', 'email', 'phone', 'address'].forEach((k) => {
    if (req.body[k] !== undefined) client[k] = req.body[k];
  });
  await client.save();
  if (!client.portalUser && req.body.createLogin && req.body.loginEmail && req.body.loginPassword?.length >= 6)
    await attachPortalLogin(client, client.contactName, req.body.loginEmail, req.body.loginPassword);
  res.json(client);
}));

router.delete('/:id', ah(async (req, res) => {
  if (await Project.exists({ client: req.params.id }))
    return res.status(400).json({ message: 'This client still has projects — reassign or delete them first' });
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  if (client.portalUser) await User.deleteOne({ _id: client.portalUser });
  await client.deleteOne();
  res.json({ message: 'Client removed' });
}));

export default router;