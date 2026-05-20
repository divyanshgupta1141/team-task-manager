# TeamFlow — Team Task Manager

A production-ready full-stack Team Task Manager with JWT authentication, role-based access control, project collaboration, task assignment, and analytics dashboard.

**Live Demo:** [Frontend Deployment](https://your-vercel-frontend-link.vercel.app) · [Backend API Gateway](https://your-railway-backend-link.railway.app)
*(Note: Please update these with your actual Vercel and Railway links post-deployment)*

---

## 📸 Screenshots

### 📊 Admin Dashboard
![Admin Dashboard](docs/screenshots/dashboard.png)

### 📁 Kanban Project Board
![Kanban Project Board](docs/screenshots/project_board.png)

### 🔐 Modern Login Screen & Demo Credentials
![Login Page](docs/screenshots/login.png)

---

## 🏗️ Architecture

```mermaid
graph TD
    User([User Browser]) -->|Next.js Client Components| FE[Next.js Frontend]
    FE -->|HTTP API Requests| BE[Express Backend API]
    BE -->|Authentication Limiter| AL[Rate Limit Middleware]
    AL -->|Token Validation| AU[JWT Auth Middleware]
    AU -->|Database Access Layer| PR[Prisma ORM]
    PR -->|SQL Operations| DB[(PostgreSQL Database)]
```

---

## ✨ Features

### Functional Features
- 🔐 **JWT Authentication** — Signup, Login, persistent session handling.
- 🛡️ **Role-Based Access Control** — Admin vs Member granular permission enforcement.
- 📁 **Project Management** — Create, view, update, delete projects with target due dates.
- 👥 **Team Management** — Invite members by email, track member involvement across workspaces.
- ✅ **Task Management** — Create, assign, prioritize, and track task progression on a board.
- 📊 **Analytics Dashboard** — Stats counters, task distribution pie charts, completion progress, and recent activities.
- 🎨 **Professional Dark UI** — Responsive layout, linear gradients, and responsive navigation.

### 🏗️ Production Features
- **Secure Authentication Layer:** Built-in JWT verification with immediate cookie/header synchronization.
- **Server-Side RBAC Enforcement:** Strict check rules at the middleware level matching database scopes.
- **Relational Performance:** Prisma ORM schema optimized using explicit index flags on foreign-key columns.
- **Startup Boot Validation:** Auto-verification of environment variables (`DATABASE_URL`, `JWT_SECRET`) preventing silent startup crashes.
- **Graceful Error Handling:** REST endpoints respond with appropriate HTTP status codes (400, 401, 403, 404) and clean JSON error wrappers.
- **Auth Endpoint Rate Limiting:** Prevents brute-force credential stuffing with request limits per window.
- **Toast State Management:** Stable state subscription system preventing memory leaks on component unmount.

---

## 🔒 Security
- **Password Hashing:** Passwords securely stored using `bcryptjs` one-way salt hashing.
- **Token Security:** JWT signature encryption with secret validation checks.
- **Endpoint Protection:** Route-level middleware checking session token validity.
- **Brute-Force Prevention:** Request limiter restricting public authentication requests.
- **Query Validation:** Client and server-side request body payload enforcement using `Zod` schemas.

---

## ⚡ Engineering Challenges Solved
- **Session Drift Prevention:** Implemented client startup verification checking `/auth/me` to refresh or sign out expired browser local-storage sessions.
- **Database Scale Performance:** Added Prisma schema indexing on lookup columns (`createdById`, `projectId`, `assignedToId`) to optimize query speeds.
- **RBAC UX Cohesiveness:** Disabled visual controls and state triggers on client dashboard fields for regular members, aligning with backend permissions.
- **Toast Subscriptions:** Eliminated React hot-reload listener duplication by transitioning hooks to a cleanup-compliant subscription pattern.
- **Entity Validation:** Standardized 404 responses for requests containing non-existent IDs instead of leaking Express internal database stack traces.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Auth | JWT, bcryptjs |
| ORM | Prisma |
| Database | PostgreSQL |
| Validation | Zod, React Hook Form |
| Charts | Recharts |
| Deployment | Railway (API + DB), Vercel (Frontend) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy env and fill in values
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/teamtaskmanager"
JWT_SECRET="your-super-secret-key-min-32-chars"
PORT=5000
FRONTEND_URL=http://localhost:3000
```

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed demo data
npm run db:seed

# Start dev server
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🎭 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@demo.com | password123 |
| **Member** | member@demo.com | password123 |

---

## 📡 API Endpoints

### Authentication
```
POST /api/auth/signup     — Register new user (with rate limiting)
POST /api/auth/login      — Login & get JWT (with rate limiting)
GET  /api/auth/me         — Get current user session
```

### Projects
```
GET    /api/projects           — List projects
POST   /api/projects           — Create project (Admin)
GET    /api/projects/:id       — Get project details
PUT    /api/projects/:id       — Update project (Admin)
DELETE /api/projects/:id       — Delete project (Admin)
POST   /api/projects/:id/add-member        — Add member (Admin)
DELETE /api/projects/:id/members/:userId   — Remove member (Admin)
```

### Tasks
```
GET    /api/tasks              — List tasks (filtered by role)
POST   /api/tasks              — Create task (Admin)
PUT    /api/tasks/:id          — Update task (Admin full / Member status only)
DELETE /api/tasks/:id          — Delete task (Admin)
GET    /api/tasks/dashboard    — Dashboard stats
```

---

## 🔑 Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ❌ |
| Add team members | ✅ | ❌ |
| Create & assign tasks | ✅ | ❌ |
| Delete tasks/projects | ✅ | ❌ |
| Update any task field | ✅ | ❌ |
| Update own task status | ✅ | ✅ |
| View assigned projects | ✅ | ✅ |

---

## 🚧 Future Improvements
- 🔄 **Real-Time Synchronicity:** Integrate WebSockets/Socket.io to stream real-time updates.
- 🎛️ **Drag-and-Drop Canvas:** Enable drag-and-drop task status transitions on the Kanban project board.
- ✉️ **Activity Notifications:** Send email digests for new task assignments or projects.
- 📎 **File Attachments:** Support uploading assets directly into tasks.

---

## 🌐 Deployment

### Backend on Railway

1. Push backend to GitHub
2. Create new Railway project → Connect repo
3. Add PostgreSQL plugin
4. Set environment variables:
   ```
   DATABASE_URL=<from Railway PostgreSQL>
   JWT_SECRET=<strong-random-string>
   PORT=5000
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```
5. Set start command: `npm run build && npm start`
6. Run migrations: `npx prisma migrate deploy`

### Frontend on Vercel

1. Import GitHub repo on Vercel
2. Set root directory to `frontend`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app/api
   ```
4. Deploy

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, logger, rate-limiter, error handling
│   │   ├── routes/         # Express routers
│   │   ├── utils/          # Zod validators
│   │   ├── prisma/         # Prisma client singleton
│   │   ├── app.ts          # Express app
│   │   └── server.ts       # Entry point
│   └── prisma/
│       ├── schema.prisma   # DB schema with indexed keys
│       └── seed.ts         # Demo data seeder
└── frontend/
    └── src/
        ├── app/
        │   ├── (auth)/     # Login, Signup pages
        │   └── (dashboard)/ # Protected pages
        ├── components/     # Reusable UI components & skeleton loaders
        ├── context/        # Auth session context
        ├── hooks/          # Custom hooks (toast, etc)
        ├── lib/            # Axios instance, utilities
        ├── services/       # API service functions
        └── types/          # TypeScript interfaces
```

---

## 👨‍💻 Author

**Divyansh Gupta**

> Built as a production-focused full-stack collaboration platform demonstrating authentication, RBAC, relational database design, and scalable API architecture.
