// File.js
import mongoose from 'mongoose';
const fileSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  mime: { type: String, default: '' },
  size: { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model('File', fileSchema);