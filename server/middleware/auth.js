import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token = null;
  if (req.headers.authorization?.startsWith('Bearer ')) token = req.headers.authorization.slice(7);
  if (!token && req.query.token) token = req.query.token; // allows direct download links
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');
    req.user = await User.findById(decoded.id).populate('clientRef');
    if (!req.user) return res.status(401).json({ message: 'Account no longer exists' });
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired session — please sign in again' });
  }
};

export const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: 'You do not have permission for this action' });