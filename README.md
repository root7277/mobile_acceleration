# Mobil Acceleration Courses Management Platform

Enterprise-level full-stack web application for government and training organizations to manage mobile acceleration courses and track participants from remote communities.

## Tech Stack

- **Frontend**: React 18, Vite, React Router, Chart.js, jsPDF
- **Backend**: Node.js, Express.js
- **Database**: SQLite (with PostgreSQL schema available)
- **Auth**: JWT, bcrypt

## Project Structure

```
/frontend          - React SPA
/backend           - Express REST API
/database          - SQL schemas
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Build tools (for better-sqlite3): `build-essential` on Linux, or run `npm rebuild better-sqlite3` if install fails

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (JWT_SECRET, PORT)
npm run init-db
npm run migrate   # Run migrations for lesson management, i18n
npm run dev
```

The API runs at `http://localhost:5000`.

**Default Super Admin**: `superadmin` / `SuperAdmin123!` (change in production!)

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000` with API proxy to the backend.

### 3. Production Build

```bash
# Backend
cd backend && npm start

# Frontend - build static files
cd frontend && npm run build
# Serve the dist/ folder with nginx, Apache, or any static server
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | - | User registration |
| POST | /api/auth/login | - | Login |
| GET | /api/auth/profile | ✓ | Current user |
| GET | /api/users | Admin | List users |
| GET | /api/users/me/stats | ✓ | Dashboard stats |
| GET | /api/courses | - | List courses |
| GET | /api/courses/:id | - | Course details |
| POST | /api/courses | Admin | Create course |
| PUT | /api/courses/:id | Admin | Update course |
| DELETE | /api/courses/:id | Admin | Delete course |
| POST | /api/enrollments/course/:courseId | ✓ | Enroll in course |
| GET | /api/enrollments/my | ✓ | My enrollments |
| POST | /api/progress/enrollment/:id/lesson/:lessonId | ✓ | Mark lesson complete (legacy) |
| GET | /api/lessons/course/:courseId | - | List lessons |
| GET | /api/lessons/:id | ✓ | Get lesson (enforces sequential lock) |
| GET | /api/lessons/course/:courseId/status | ✓ | Lesson status (completed/available/locked) |
| POST | /api/lesson-progress/complete | ✓ | Complete lesson (video 90% or mark) |
| POST | /api/lessons | Admin | Create lesson |
| PUT | /api/lessons/:id | Admin | Update lesson |
| DELETE | /api/lessons/:id | Admin | Delete lesson |
| PATCH | /api/users/me/language | ✓ | Update preferred language |
| GET | /api/certificates/my | ✓ | My certificates |
| GET | /api/certificates/verify/:code | - | Verify certificate (public) |
| GET | /api/statistics/* | Admin | Analytics |

## User Roles

- **Student**: Browse courses, enroll, track progress, earn certificates
- **Admin**: Manage courses, users, view statistics
- **Super Admin**: Full system access, manage admins

## Features

- ✅ JWT authentication & role-based access
- ✅ User registration (Region, District, Mahalla)
- ✅ Course management with lessons
- ✅ Enrollment & progress tracking
- ✅ Automatic certificate generation on completion
- ✅ Certificate verification & PDF download
- ✅ Admin panel (users, courses, enrollments)
- ✅ Statistics by region, district, neighborhood
- ✅ Activity logs
- ✅ Lesson management (content, video, files, rich text)
- ✅ Sequential lesson lock (strict order progression)
- ✅ Multi-language support (EN, UZ, RU)
- ✅ File upload (videos MP4, files PDF/DOC/ZIP)
- ✅ Lesson player with video, content, downloads

## Environment Variables

**Backend (.env)**

```
PORT=5000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
DATABASE_PATH=./database/mobil_acceleration.db
NODE_ENV=development
```

## License

Proprietary - Government & Training Organizations
