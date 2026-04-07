# ARCHITECTURE.md — Task Manager Application

## 1. System Overview

This is a full-stack task management application with three layers:

- **Frontend (Next.js)**: A React-based single-page application using Next.js App Router. Handles user authentication, task management UI, and real-time updates via Socket.io.
- **Backend (NestJS)**: A RESTful API server built with NestJS. Handles authentication (JWT), task CRUD operations, role-based access control, and WebSocket event broadcasting.
- **Database (MongoDB)**: Stores users and tasks using Mongoose ODM with defined schemas and indexes.

### How They Connect

```
┌─────────────────┐     HTTP (REST API)      ┌──────────────────┐
│   Next.js       │ ◄─────────────────────► │   NestJS          │
│   Frontend      │     WebSocket (Socket.io) │   Backend         │
│   :3000         │ ◄─────────────────────► │   :3001           │
└─────────────────┘                          └──────┬───────────┘
                                                     │
                                                     │ Mongoose
                                                     ▼
                                             ┌──────────────────┐
                                             │   MongoDB Atlas   │
                                             │   (Cloud DB)      │
                                             └──────────────────┘
```

Authentication flows through JWT tokens stored in httpOnly cookies. The frontend sends credentials, receives a cookie, and all subsequent requests include the cookie automatically. WebSocket connections also authenticate using JWT tokens.

---

## 2. Folder Structure

### Backend (`/backend`)

```
backend/
├── src/
│   ├── main.ts                          # App bootstrap, CORS, validation
│   ├── app.module.ts                    # Root module
│   │
│   ├── auth/                            # Authentication module
│   │   ├── auth.module.ts               # Module definition
│   │   ├── auth.service.ts              # Register, login, profile logic
│   │   ├── auth.controller.ts           # POST /auth/register, /auth/login, /auth/logout, GET /auth/profile
│   │   ├── jwt.strategy.ts              # Passport JWT strategy (cookie + bearer)
│   │   ├── jwt-auth.guard.ts            # Auth guard using passport-jwt
│   │   └── dto/
│   │       ├── register.dto.ts          # Validation: username, email, password
│   │       └── login.dto.ts             # Validation: email, password
│   │
│   ├── users/                           # Users module
│   │   ├── users.module.ts
│   │   ├── users.service.ts             # CRUD operations, password hashing
│   │   ├── users.controller.ts          # GET /users (admin only)
│   │   └── user.schema.ts              # Mongoose User schema
│   │
│   ├── tasks/                           # Tasks module
│   │   ├── tasks.module.ts
│   │   ├── tasks.service.ts             # CRUD with RBAC enforcement
│   │   ├── tasks.controller.ts          # Full REST endpoints
│   │   └── dto/
│   │       ├── create-task.dto.ts
│   │       ├── update-task.dto.ts
│   │       └── filter-tasks.dto.ts
│   │
│   ├── gateway/                         # WebSocket module
│   │   ├── events.module.ts
│   │   └── events.gateway.ts            # Socket.io gateway with JWT auth
│   │
│   ├── seed/                            # Database seeding
│   │   ├── seed.module.ts
│   │   └── seed.service.ts              # Seeds 3 users on first run
│   │
│   └── common/
│       ├── decorators/
│       │   └── roles.decorator.ts       # @Roles() custom decorator
│       └── guards/
│           └── roles.guard.ts           # RolesGuard for RBAC
│
├── .env                                 # Environment variables
├── tsconfig.json
└── package.json
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout with providers
│   │   ├── page.tsx                     # Redirect to dashboard/login
│   │   ├── globals.css                  # Design system + Tailwind
│   │   ├── login/page.tsx               # Login page
│   │   ├── register/page.tsx            # Register page
│   │   └── dashboard/
│   │       ├── layout.tsx               # Auth-protected layout
│   │       └── page.tsx                 # Task dashboard
│   │
│   ├── components/
│   │   ├── Navbar.tsx                   # Navigation bar
│   │   ├── TaskCard.tsx                 # Task display card
│   │   ├── TaskForm.tsx                 # Create/edit task modal
│   │   └── TaskFilterBar.tsx            # Filter and sort controls
│   │
│   ├── context/
│   │   ├── AuthContext.tsx              # Auth state provider
│   │   └── SocketContext.tsx            # WebSocket event provider
│   │
│   └── lib/
│       ├── api.ts                       # Axios instance
│       ├── socket.ts                    # Socket.io client
│       └── types.ts                     # TypeScript interfaces
│
├── .env.local
└── package.json
```

---

## 3. Database Schema

### User Schema

```typescript
{
  username: string     // Unique, required, trimmed. Display name.
  email: string        // Unique, required, lowercase. Used for login.
  password: string     // Required. Bcrypt hashed (10 salt rounds).
  role: string         // Enum: 'admin' | 'member'. Default: 'member'. Controls RBAC permissions.
  createdAt: Date      // Auto-generated by timestamps: true
  updatedAt: Date      // Auto-generated by timestamps: true
}
```

### Task Schema

```typescript
{
  title: string             // Required, trimmed. Task name.
  description: string       // Optional, trimmed. Detailed description.
  status: string            // Enum: 'todo' | 'in-progress' | 'done'. Default: 'todo'.
  priority: string          // Enum: 'low' | 'medium' | 'high'. Default: 'medium'.
  dueDate: Date             // Optional. When the task is due.
  user: ObjectId (ref User) // Required. The user who created this task.
  assignedTo: ObjectId      // Optional (ref User). Admin can assign tasks to other users.
  createdAt: Date            // Auto-generated
  updatedAt: Date            // Auto-generated
}

Indexes:
  - { user: 1, status: 1 }     — Fast filtering by owner + status
  - { user: 1, priority: 1 }   — Fast filtering by owner + priority
  - { assignedTo: 1 }          — Fast lookup of assigned tasks
```

---

## 4. API Endpoints

### Authentication

| Method | Path                | Auth | Request Body                              | Response                                    |
|--------|---------------------|------|-------------------------------------------|---------------------------------------------|
| POST   | /api/auth/register  | No   | `{ username, email, password }`           | `{ message, user: { id, username, email, role } }` |
| POST   | /api/auth/login     | No   | `{ email, password }`                     | `{ accessToken, user }` + sets httpOnly cookie |
| POST   | /api/auth/logout    | No   | —                                         | `{ message }` + clears cookie              |
| GET    | /api/auth/profile   | Yes  | —                                         | `{ id, username, email, role, createdAt }`  |

### Tasks

| Method | Path              | Auth | Roles        | Request Body / Query                       | Response           |
|--------|-------------------|------|--------------|--------------------------------------------|--------------------|
| POST   | /api/tasks        | Yes  | Any          | `{ title, description?, status?, priority?, dueDate?, assignedTo? }` | Task object |
| GET    | /api/tasks        | Yes  | Any          | Query: `?status=&priority=&sortBy=&sortOrder=&search=` | Task[] |
| GET    | /api/tasks/:id    | Yes  | Any          | —                                          | Task object        |
| PATCH  | /api/tasks/:id    | Yes  | Any          | Partial task fields                        | Updated task       |
| DELETE | /api/tasks/:id    | Yes  | Any          | —                                          | `{ message }`      |

**RBAC rules applied at service level:**
- Admin: can view, edit, delete ALL tasks; can assign tasks to other users
- Member: can only view/edit/delete their own tasks (or tasks assigned to them); cannot assign tasks

### Users

| Method | Path         | Auth | Roles  | Response                                    |
|--------|-------------|------|--------|---------------------------------------------|
| GET    | /api/users  | Yes  | Admin  | `[{ id, username, email, role, createdAt }]` |

---

## 5. Auth Flow

### Registration
```
1. User submits { username, email, password } to POST /api/auth/register
2. Backend validates input (class-validator: email format, password min 6 chars)
3. Backend checks for existing user (email or username)
4. Password is hashed with bcrypt (10 salt rounds)
5. User document is created with role: 'member'
6. Response: { message: 'Registration successful', user: { id, username, email, role } }
```

### Login
```
1. User submits { email, password } to POST /api/auth/login
2. Backend finds user by email
3. Backend compares password with bcrypt hash
4. JWT token is created with payload: { sub: userId, email, role }
5. Token is set as httpOnly cookie (access_token, 24h expiry, SameSite: Lax)
6. Response: { accessToken, user }
```

### Protected Route Access
```
1. Frontend makes request with credentials (cookies sent automatically)
2. JwtStrategy extracts token from cookie (or Authorization header as fallback)
3. Token is verified with JWT_SECRET
4. User payload { userId, email, role } is attached to request.user
5. RolesGuard checks @Roles() decorator if present
6. If role doesn't match → 403 Forbidden
7. Request proceeds to controller/service
```

### WebSocket Authentication
```
1. Frontend connects to Socket.io with auth: { token }
2. EventsGateway.handleConnection() extracts token from handshake
3. Token is verified with JwtService
4. If invalid → client.emit('error') + client.disconnect()
5. If valid → user payload stored on socket, connection accepted
```

---

## 6. AI Tools Used

See `AI_LOG.md` for full details.

- **Gemini (Antigravity IDE)**: Used for scaffolding the project structure, generating boilerplate code, and creating backend modules. All generated code was reviewed and modified for correctness.

---

## 7. Decisions & Trade-offs

### httpOnly Cookies vs localStorage for JWT
**Chose: httpOnly Cookies**
- More secure against XSS attacks (JavaScript cannot access the token)
- Automatic inclusion in requests via `withCredentials: true`
- Trade-off: Requires CORS configuration with credentials support

### Mongoose vs Prisma
**Chose: Mongoose** (as specified in the task requirements)
- Direct MongoDB ODM with schema-based modeling
- Rich middleware and plugin ecosystem
- Trade-off: Less type safety than Prisma, but more flexible for MongoDB-specific features

### WebSocket Authentication Strategy
**Chose: Token in handshake auth**
- Token passed via `socket.handshake.auth.token` on connection
- Also supports extracting from cookies as fallback
- Reconnection: Socket.io's built-in reconnection (5 attempts, 1s delay) re-sends auth
- Trade-off: Token must be available client-side for initial connection

### RBAC Implementation
**Chose: Custom @Roles() decorator + RolesGuard**
- `SetMetadata` stores allowed roles on route handlers
- `RolesGuard` reads metadata via `Reflector` and checks `request.user.role`
- Role is embedded in JWT payload, so no extra DB query needed for auth checks
- Service-level ownership checks for fine-grained access (e.g., member can only edit own tasks)
- Trade-off: Role changes require re-login to get new JWT

### What I Would Improve
- **Refresh tokens**: Add refresh token rotation for better security
- **Pagination**: Add cursor-based pagination for large task lists
- **Task comments**: Allow users to comment on tasks
- **Email notifications**: Send email on task assignment
- **Unit tests**: Add comprehensive test coverage
- **Rate limiting**: Add rate limiting to prevent abuse
