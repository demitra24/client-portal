import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'changes'], default: 'pending' },
  feedback: { type: String, default: '' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestedAt: { type: Date, default: Date.now },
  decidedAt: Date,
}, { _id: true });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },           // e.g. HLD-01
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['planning', 'active', 'review', 'completed'], default: 'planning' },
  deadline: { type: Date, default: null },
  budget: { type: Number, default: 0 },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvals: [approvalSchema],
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);