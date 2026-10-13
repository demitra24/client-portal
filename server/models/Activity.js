// Activity.js
import mongoose from 'mongoose';
const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ['project', 'task', 'comment', 'file', 'approval', 'user'], default: 'task' },
  message: { type: String, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
}, { timestamps: true });
export default mongoose.model('Activity', activitySchema);