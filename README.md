# Portal — Client Project Management System

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-010101?logo=socket.io&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-black)

A full-stack project management platform for agencies — projects, tasks, deadlines,
deliverables, and clients in the loop, in real time.

🔗 **[Live Demo](https://client-portal-nine-rho.vercel.app)** — one-click demo logins on the page

| Role | Email | Password |
|---|---|---|
| Admin | `admin@portal.io` | `admin123` |
| Team member | `daniel@portal.io` | `member123` |
| Client | `clara@halstead.io` | `client123` |

## ✨ Features

- **Role-based dashboards** — admins, team members, and clients each get a different
  view; access control is enforced server-side on every route
- **Real-time sync** — drag a task and every open screen updates instantly (Socket.IO rooms)
- **Live activity feed** — every action across the workspace streams in as it happens
- **Kanban board** — drag & drop tasks across To do / In progress / Review / Done
- **Approval workflows** — send deliverables for client sign-off; clients approve or
  request changes with written feedback, full history preserved
- **File sharing** — upload/download deliverables per project with role-aware permissions
- **Discussions** — threaded project comments between team and client
- **Deadline intelligence** — overdue detection, due-this-week counts, progress rings

## 🏗 Architecture

Client (React + Vite + Tailwind) → Express REST API + Socket.IO (Render)
→ MongoDB Atlas → JWT-protected routes, RBAC middleware, Multer uploads

## 📸 Screenshots

| | |

|---|---

| ![Dashboard](screenshots/dashboard.png) | ![Board](screenshots/board.png) |
| ![Approval](screenshots/approval.png) | ![Login](screenshots/login.png) |

## ⚙️ Local setup

```bash
# 1. Backend
cd server
cp .env.example .env      # set MONGO_URI + JWT_SECRET
npm install
npm run seed              # demo data + accounts
npm run dev               # http://localhost:5001

# 2. Frontend (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173
