# SSBCircle

A voice chat platform for SSB group discussion practice. Create voice rooms instantly, share a 6-character code, and practice GD together — no account needed.

## Tech Stack

- **Frontend** – React 18 + Vite + Tailwind CSS (deploy: Vercel)
- **Backend** – Node.js + Express + PostgreSQL (deploy: DigitalOcean)
- **Voice** – Jitsi Meet External API (meet.jit.si)

---

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Clone & install

```bash
git clone <repo-url>
cd ssbcircle

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Set up the database

```sql
CREATE DATABASE ssbcircle;
```

The backend auto-creates the `rooms` table on first start.

### 3. Configure environment variables

**backend/.env** (copy from `.env.example`):
```
PORT=4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/ssbcircle
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**frontend/.env** (copy from `.env.example`):
```
VITE_API_URL=http://localhost:4000
VITE_JITSI_DOMAIN=meet.jit.si
```

### 4. Run

```bash
# Terminal 1 – backend
cd backend
npm run dev

# Terminal 2 – frontend
cd frontend
npm run dev
```

App runs at http://localhost:5173

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/rooms` | Create a new room |
| `GET` | `/api/rooms/active` | List all active rooms |
| `GET` | `/api/rooms/:code` | Get room by 6-char code |
| `DELETE` | `/api/rooms/:code` | Close a room |

### POST /api/rooms

**Body:** `{ "topic": "Should India abolish reservations?" }`

**Response:**
```json
{
  "room": {
    "id": "uuid",
    "topic": "Should India abolish reservations?",
    "room_code": "AB3X9Z",
    "jitsi_room_name": "SSBCircle_AB3X9Z",
    "created_at": "2026-05-15T10:00:00Z",
    "is_active": true,
    "participant_count": 0
  }
}
```

---

## Deployment

### Frontend → Vercel

1. Push the `frontend/` folder to GitHub
2. Import into Vercel, set root to `frontend/`
3. Add env var: `VITE_API_URL=https://your-backend.com`
4. Deploy

### Backend → DigitalOcean (Droplet)

```bash
# On the droplet
git clone <repo> /opt/ssbcircle
cd /opt/ssbcircle/backend
npm install --production

# Set production env
cp .env.example .env
# Edit .env with production values

# Run with PM2
npm install -g pm2
pm2 start src/server.js --name ssbcircle-backend
pm2 save && pm2 startup
```

Configure Nginx to reverse-proxy port 4000 and add an SSL cert via Certbot.

### Switch to custom Jitsi domain

When you have `meet.ssbcircle.com` set up:

1. Update `VITE_JITSI_DOMAIN=meet.ssbcircle.com` in Vercel env vars
2. Rebuild and redeploy the frontend

No backend changes needed — the Jitsi domain is frontend-only.

---

## Database Schema

```sql
CREATE TABLE rooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic            VARCHAR(255) NOT NULL,
  room_code        VARCHAR(10) UNIQUE NOT NULL,
  jitsi_room_name  VARCHAR(255) NOT NULL,
  created_at       TIMESTAMP DEFAULT NOW(),
  is_active        BOOLEAN DEFAULT true,
  participant_count INT DEFAULT 0
);
```
