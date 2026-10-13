import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import clientRoutes from './routes/clients.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const server = http.createServer(app);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ---------------------------- CORS ----------------------------
   Production: set CLIENT_URL to your exact Vercel URL (no trailing slash).
   If CLIENT_URL is unset, allow all origins — the API itself is still
   JWT-protected on every route, so nothing is exposed.                     */
const corsOrigin = process.env.CLIENT_URL || true;
app.use(cors({ origin: corsOrigin, credentials: true }));

/* ------------------------------- Socket.IO -------------------------------- */
const io = new Server(server, { cors: { origin: corsOrigin, credentials: true } });
global.io = io;

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('auth failed'));
    const d = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');
    socket.userId = d.id;
    next();
  } catch { next(new Error('auth failed')); }
});

io.on('connection', (socket) => {
  socket.on('project:join', (id) => socket.join(`project:${id}`));
  socket.on('project:leave', (id) => socket.leave(`project:${id}`));
});

/* --------------------------------- Express -------------------------------- */
app.use(express.json());

/* ---------------------------- security middleware -------------------------- */
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // 'cross-origin' so Vercel can load /uploads images

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 25,                     // max 25 login attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts — try again in 15 minutes' },
});
app.use('/api/auth/login', loginLimiter); // brute-force protection

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'portal-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// serve the built React app in production (client/dist)
// on Render (root dir = server) this folder won't exist, so it's skipped
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

// central error handler (validation, bad ids, multer limits)
app.use((err, req, res, next) => {
  if (err?.name === 'MulterError')
    return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 15 MB limit' : 'Upload failed' });
  if (err?.name === 'ValidationError')
    return res.status(400).json({ message: Object.values(err.errors)[0]?.message || 'Validation failed' });
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier' });
  if (err?.code === 11000) return res.status(409).json({ message: 'That value already exists' });
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5001;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`✔ Portal API running → http://localhost:${PORT}`));
});