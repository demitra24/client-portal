import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'member', 'client'], default: 'member' },
  title: { type: String, default: '' }, // e.g. "Design Lead" / "Marketing Director"
  clientRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null }, // links client-role users to their company
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.set('toJSON', {
  transform(doc, ret) { delete ret.password; delete ret.__v; return ret; },
});

export default mongoose.model('User', userSchema);