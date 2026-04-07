# Task Manager — Full-Stack Application

A full-stack Task Management application built with **NestJS**, **Next.js**, and **MongoDB**.  
Includes real-time WebSocket notifications and role-based access control.

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- **MongoDB** (Atlas cluster or local instance)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd task_manager
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file (copy from .env.example and fill in values)
cp ../.env.example backend/.env
# Edit .env and set your MONGODB_URI

# Start the backend (development)
npm run start:dev
```

The backend runs on **http://localhost:3001**

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
echo "NEXT_PUBLIC_WS_URL=http://localhost:3001" >> .env.local

# Start the frontend (development)
npm run dev
```

The frontend runs on **http://localhost:3000**

### 4. Seed Data

On first startup, the backend automatically seeds 3 users:

| Role   | Email                      | Password    |
|--------|----------------------------|-------------|
| Admin  | admin@taskmanager.com      | Admin123!   |
| Member | member1@taskmanager.com    | Member123!  |
| Member | member2@taskmanager.com    | Member123!  |

---

## 📁 Project Structure

```
task_manager/
├── backend/                  # NestJS API
│   └── src/
│       ├── auth/             # JWT authentication
│       ├── users/            # User management
│       ├── tasks/            # Task CRUD
│       ├── gateway/          # WebSocket gateway
│       ├── seed/             # Database seeding
│       └── common/           # Shared guards & decorators
├── frontend/                 # Next.js UI
│   └── src/
│       ├── app/              # Pages (App Router)
│       ├── components/       # Reusable components
│       ├── context/          # Auth & Socket providers
│       └── lib/              # API client, types, socket
├── ARCHITECTURE.md           # Architecture document
├── README.md                 # This file
├── AI_LOG.md                 # AI tools log
└── .env.example              # Environment template
```

## ✨ Features

### Core
- ✅ User registration and login with JWT (httpOnly cookies)
- ✅ Full CRUD for tasks (title, description, status, priority, due date)
- ✅ Filter and sort tasks by status, priority, and due date
- ✅ Route protection using NestJS Guards
- ✅ Input validation using class-validator
- ✅ Mongoose schemas with correct field types

### Bonus A — Real-Time Notifications (WebSockets)
- ✅ Socket.io WebSocket gateway
- ✅ Emit events on task create, update, delete
- ✅ Reactive task list updates on the frontend
- ✅ Authenticated WebSocket connections only
- ✅ Toast notifications for real-time events

### Bonus B — Role-Based Access Control (RBAC)
- ✅ Admin and Member roles
- ✅ API-level enforcement (not just UI)
- ✅ Custom `@Roles()` decorator + `RolesGuard`
- ✅ Admin: view all tasks, edit/delete any, assign to others
- ✅ Member: view and manage own tasks only
- ✅ 403 Forbidden on unauthorized actions
- ✅ Seeded test users (1 admin, 2 members)

## 🛠 Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Backend  | NestJS + TypeScript |
| Database | MongoDB + Mongoose |
| Frontend | Next.js 16 (App Router) |
| Styling  | Tailwind CSS v4   |
| Auth     | JWT + httpOnly Cookies |
| Realtime | Socket.io         |

## 📜 License

This project is for internship evaluation purposes.
