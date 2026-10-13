// Comment.js
import mongoose from 'mongoose';
const commentSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
}, { timestamps: true });
export default mongoose.model('Comment', commentSchema);