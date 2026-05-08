# FeaturePulse AI

FeaturePulse AI is a full-stack SaaS tool that automatically fetches mobile app reviews from the Play Store and App Store, then uses Claude AI to generate prioritized bug fixes, validated feature ideas, competitor threat analysis, and sentiment breakdowns — all delivered with live progress updates via WebSockets. Built with NestJS, React, PostgreSQL, BullMQ (Upstash Redis), and Socket.IO, it demonstrates production-grade architecture including JWT auth, background queue workers, real-time progress streaming, and AI-powered analysis at scale.

## Architecture Overview

```
┌─────────────────┐    HTTP/WS    ┌──────────────────────────────────────────────┐
│  React Frontend │ ◄──────────► │  NestJS Backend                              │
│  (Vite + TW)    │              │  ┌──────────┐  ┌────────┐  ┌──────────────┐  │
└─────────────────┘              │  │Auth (JWT)│  │  Apps  │  │   Reviews    │  │
                                 │  └──────────┘  └────────┘  └──────────────┘  │
                                 │  ┌──────────┐  ┌────────┐  ┌──────────────┐  │
                                 │  │ Analysis │  │  Jobs  │  │  Competitor  │  │
                                 │  └──────────┘  └────────┘  └──────────────┘  │
                                 │  ┌───────────────────────┐                   │
                                 │  │  Socket.IO Gateway    │ ← Progress Events  │
                                 │  └───────────────────────┘                   │
                                 └─────────────┬────────────────────────────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              │                │                │
                     ┌────────▼──────┐  ┌──────▼───────┐  ┌────▼────────┐
                     │  PostgreSQL   │  │  Upstash Redis│  │ Claude API  │
                     │  (TypeORM)    │  │  + BullMQ     │  │(Anthropic)  │
                     └───────────────┘  └───────────────┘  └────────────┘
```

### Key Flows
- **Review Fetch**: User triggers → Job created in DB → BullMQ worker scrapes stores → Emits Socket.IO progress → Saves to PostgreSQL
- **AI Analysis**: User triggers → Worker loads reviews → Builds Claude prompt → Streams back structured JSON → Saves to DB → Notifies frontend
- **Real-time Progress**: Every worker step emits WebSocket event → Frontend progress bar animates live 0→100%

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS (TypeScript), TypeORM |
| Database | PostgreSQL |
| Cache/Queue | Upstash Redis + BullMQ |
| AI | Claude claude-sonnet-4-20250514 (Anthropic SDK) |
| Real-time | Socket.IO |
| Auth | JWT + bcrypt |
| Frontend | React 18, Vite, Tailwind CSS |
| Charts | Recharts |
| PDF Export | Puppeteer |
| Docs | Swagger/OpenAPI |

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or hosted, e.g., Supabase free tier)
- [Upstash Redis](https://upstash.com) account (free, no credit card)
- [Anthropic API key](https://console.anthropic.com)

### 1. Backend Setup

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env
```

Fill in `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/featurepulse
JWT_SECRET=your-super-secret-key-at-least-32-chars
ANTHROPIC_API_KEY=sk-ant-...
UPSTASH_REDIS_URL=rediss://your-upstash-endpoint
UPSTASH_REDIS_TOKEN=your-upstash-token
FRONTEND_URL=http://localhost:5173
PORT=3000
```

**Getting Upstash Redis (free):**
1. Go to [upstash.com](https://upstash.com) → Create account
2. Create a Redis database (free tier: 10k commands/day)
3. Copy the "Redis URL" (starts with `rediss://`) → `UPSTASH_REDIS_URL`
4. Copy the password/token → `UPSTASH_REDIS_TOKEN`

```bash
# Run seed (creates demo user + Spotify app with 15 reviews + analysis)
npm run seed

# Start development server
npm run start:dev
```

Backend runs on http://localhost:3000  
Swagger docs: http://localhost:3000/api/docs

### 2. Frontend Setup

```bash
cd frontend
npm install

cp .env.example .env
```

Fill in `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

```bash
npm run dev
```

Frontend runs on http://localhost:5173

### 3. Demo Login

After running the seed script:
- **Email:** demo@featurepulse.ai  
- **Password:** demo1234

The demo account comes with a pre-seeded Spotify app with 15 reviews and a full AI analysis ready to explore.

## Features

### Core Features
- **Multi-platform review fetching** — Play Store + App Store via scraping
- **AI-powered analysis** — Claude generates structured JSON with bugs, features, sentiment
- **Live progress tracking** — WebSocket-powered progress bar during fetch/analysis jobs
- **Competitor comparison** — Add competitor apps, compare sentiment side-by-side
- **PDF/HTML export** — Full report with charts, fixes, and feature ideas
- **JWT authentication** — Secure per-user data isolation

### Analysis Outputs
- **Prioritized Bug Fixes** — Ranked by severity + frequency, with exact user quotes
- **Feature Ideas** — Validated by review evidence, with implementation complexity estimate
- **Sentiment Breakdown** — Positive/neutral/negative with donut chart
- **Competitor Mentions** — Named competitors with threat level assessment

## API Endpoints

All protected endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/profile` | Get current user |
| POST | `/apps` | Add app by store link |
| GET | `/apps` | List user's apps |
| GET | `/apps/:id` | App details |
| DELETE | `/apps/:id` | Delete app |
| GET | `/apps/:id/fetch-reviews` | Get fetch status |
| POST | `/apps/:id/fetch-reviews/confirm` | Queue review fetch job |
| GET | `/apps/:id/reviews` | List reviews (paginated) |
| POST | `/apps/:id/analyse` | Queue AI analysis |
| GET | `/apps/:id/analyses` | List past analyses |
| GET | `/apps/:id/analyses/latest` | Latest analysis |
| POST | `/apps/:id/competitor` | Add competitor |
| GET | `/apps/:id/competitor-analysis` | Competitor comparison |
| GET | `/jobs/:id` | Job status (polling fallback) |
| GET | `/apps/:id/analyses/latest/export-html` | Export as HTML |
| GET | `/apps/:id/analyses/latest/export-pdf` | Export as PDF |

Full Swagger docs at `/api/docs`.

## Project Structure

```
featurePulseAI/
├── backend/
│   └── src/
│       ├── auth/              # JWT auth, register, login
│       ├── apps/              # App CRUD + store scraping
│       ├── reviews/           # Review fetch + pagination
│       ├── analysis/          # AI analysis queue + retrieval
│       ├── competitor/        # Competitor comparison
│       ├── export/            # HTML/PDF export
│       ├── jobs/              # Job status tracking
│       ├── queue/
│       │   └── workers/       # BullMQ workers (review-fetch, analysis)
│       ├── websocket/         # Socket.IO progress gateway
│       ├── common/
│       │   ├── guards/        # JwtAuthGuard
│       │   ├── interceptors/  # TransformInterceptor
│       │   └── filters/       # HttpExceptionFilter
│       └── database/          # Seed script
└── frontend/
    └── src/
        ├── pages/             # Login, Register, Dashboard, AddApp, AppDetail
        ├── components/
        │   ├── tabs/          # Overview, Reviews, Analysis, Competitor tabs
        │   ├── AppCard/       # Dashboard app card
        │   └── ProgressModal/ # Live progress overlay
        ├── contexts/          # AuthContext, JobContext
        ├── hooks/             # useSocket (Socket.IO integration)
        └── services/          # api.ts (typed API client)
```

## Screenshots

_(Add screenshots here)_

- Dashboard — app grid with quick actions
- App Detail — 4-tab layout (Overview, Reviews, Analysis, Competitor)  
- AI Analysis — sentiment chart + prioritized fixes + feature ideas
- Progress Modal — live animated progress bar during fetch/analysis

## Environment Variables Reference

### Backend
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing (32+ chars recommended) |
| `ANTHROPIC_API_KEY` | API key from console.anthropic.com |
| `UPSTASH_REDIS_URL` | Upstash Redis URL (starts with `rediss://`) |
| `UPSTASH_REDIS_TOKEN` | Upstash Redis auth token |
| `FRONTEND_URL` | Frontend origin for CORS (default: `http://localhost:5173`) |
| `PORT` | Backend port (default: `3000`) |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (default: `http://localhost:3000`) |
| `VITE_SOCKET_URL` | Socket.IO server URL (default: `http://localhost:3000`) |
