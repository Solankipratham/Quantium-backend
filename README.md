# QUANTUM Fee Management Platform

## Overview

QUANTUM is a coaching fee management platform with a React frontend and Express/Node.js backend. It uses Supabase (PostgreSQL) as the primary database with a fileStore fallback.

## Architecture

```
Frontend (React + Vite)
   ↓  API calls
API Routes (/api/*)
   ↓
Controllers (routes/*.js)
   ↓
Services (services/*.js)
   ↓
Data Layer (data/store.js)
   ↓
Database (Supabase or fileStore)
```

## Environment Variables

### Backend (`.env` in `backend/`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | Environment mode |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | JWT expiration |
| `CLIENT_URL` | Allowed CORS origin |
| `FRONTEND_URL` | Frontend URL for production |
| `STORAGE_DIR` | Local file storage directory |

### Frontend (`.env` in `frontend/`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_SUPABASE_URL` | Supabase URL for frontend |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key for frontend |

## Local Development

1. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Configure environment variables in `backend/.env` and `frontend/.env`

3. Seed the database:
   ```bash
   cd backend && npm run seed
   ```

4. Start the backend:
   ```bash
   cd backend && npm run dev
   ```

5. Start the frontend:
   ```bash
   cd frontend && npm run dev
   ```

6. Login: `admin@quantum.in` / `admin123`

## Deploy to Vercel

### Backend

1. Push code to GitHub
2. In Vercel dashboard, create a new project
3. Set the root directory to `backend/`
4. Add Vercel environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
   - `FRONTEND_URL`
   - `NODE_ENV=production`
5. Deploy

### Frontend

1. In Vercel dashboard, create a new project
2. Set the root directory to `frontend/`
3. Add environment variables:
   - `VITE_API_URL` (point to deployed backend URL)
4. Deploy

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user
- `GET /api/students` - List students
- `GET /api/students/filters` - Get filter options
- `POST /api/students` - Create student (admin)
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student (admin)
- `DELETE /api/students/:id` - Delete student (admin)
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment (admin)
- `GET /api/dashboard` - Dashboard data (admin)
- `GET /api/reports` - Reports (admin)
- And more...

## License

MIT
