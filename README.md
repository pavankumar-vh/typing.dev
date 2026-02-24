# typing.dev

> A terminal-style code typing trainer built for developers — not typists.

Practice typing real, syntax-accurate code snippets in Java, Python, and JavaScript. Track your improvement over time, compete on the global leaderboard, and let AI keep your drills fresh.

[![Netlify Status](https://api.netlify.com/api/v1/badges/placeholder/deploy-status)](https://typingdotdev.netlify.app)

**Live → [typingdotdev.netlify.app](https://typingdotdev.netlify.app)**

---

## Table of Contents

- [Demo](#demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)

---

## Demo

| Screen | Description |
|--------|-------------|
| **Train** | Real-time typing test with live WPM, accuracy, and error highlighting |
| **Leaderboard** | Global top scores ranked by WPM, filterable by language and duration |
| **My Stats** | Personal performance over time with charts and session history |
| **Profile** | Activity heatmap, best scores, and account settings |

---

## Features

### Core Typing Engine
- Character-by-character input validation with instant visual feedback
- Tracks **WPM**, **raw WPM**, **accuracy**, and **error count** live
- **Tab** → new test with a different snippet &nbsp;|&nbsp; **Esc** → restart with the same snippet
- Countdown timer modes: **15s · 30s · 60s · 120s**
- Language selection: **Java · Python · JavaScript**

### AI-Powered Snippets
- Code snippets generated and rotated via **Google Gemini API**
- Snippets are realistic, syntax-valid, and language-specific
- Cached in MongoDB to reduce API calls and ensure variety

### Authentication & Profiles
- **Firebase Authentication** — email/password sign-up and login
- Display name set at registration, shown on leaderboard
- Protected routes redirect unauthenticated users to `/login`

### Leaderboard
- Global rankings sorted by WPM
- Filter by language and test duration
- Animated entry transitions via **Framer Motion**
- Shows rank, username, WPM, accuracy, and date

### Stats & History
- Personal session history with full metrics per run
- Aggregated stats: average WPM, best WPM, total sessions
- Activity heatmap (GitHub-style) on profile page

### Design
- CRT phosphor terminal aesthetic — `#00FF41` on black
- JetBrains Mono throughout
- Scanline + vignette + phosphor glow CSS effects
- Fully responsive, dark-only

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| Vite | 7 | Build tool and dev server |
| Tailwind CSS | v4 | Utility-first styling |
| Framer Motion | 12 | Page and element animations |
| React Router | v7 | Client-side routing |
| Firebase SDK | 12 | Auth client |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥20 | Runtime |
| Express | 4 | HTTP server and routing |
| Mongoose | 8 | MongoDB ODM |
| MongoDB Atlas | — | Hosted database |
| Firebase Admin SDK | 13 | Server-side token verification |
| Google Generative AI | 0.24 | Gemini snippet generation |
| dotenv | 16 | Environment variable loading |
| cors | 2 | Cross-origin request handling |

### Infrastructure

| Layer | Service |
|-------|---------|
| Frontend hosting | [Netlify](https://typingdotdev.netlify.app) |
| Backend hosting | [Railway](https://typingdev-production.up.railway.app) |
| Database | MongoDB Atlas |
| Auth | Firebase (project: `typing-dev`) |
| AI | Google Gemini API |

---

## Architecture

```
Browser
  │
  ├─ React SPA (Netlify CDN)
  │    ├─ Firebase Auth SDK  ──────────────► Firebase Auth
  │    └─ REST API calls
  │         │
  │         ▼
  │    Express API (Railway)
  │         ├─ /api/sessions  ──────────► MongoDB Atlas
  │         ├─ /api/snippets  ──────────► MongoDB Atlas + Gemini API
  │         └─ /api/health
  │
  └─ Static assets served by Netlify
```

Auth flow: Firebase issues a JWT on login → frontend sends it as `Authorization: Bearer <token>` → backend verifies via Firebase Admin SDK → request is processed.

---

## Project Structure

```
typing.dev/
├── frontend/
│   ├── public/
│   │   └── _redirects          # Netlify SPA routing fix
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Firebase auth state provider
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Landing / test selection
│   │   │   ├── Train.jsx       # Core typing test
│   │   │   ├── Leaderboard.jsx # Global rankings
│   │   │   ├── Stats.jsx       # Global stats
│   │   │   ├── MyStats.jsx     # Personal stats
│   │   │   ├── History.jsx     # Session history
│   │   │   ├── Profile.jsx     # User profile + heatmap
│   │   │   ├── Login.jsx       # Auth — login
│   │   │   └── Signup.jsx      # Auth — registration
│   │   ├── App.jsx             # Router and layout
│   │   └── main.jsx            # Entry point
│   ├── .env.local              # VITE_API_URL + Firebase config
│   ├── vite.config.js
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── config/
    │   │   └── db.js           # Mongoose connection
    │   ├── controllers/
    │   │   ├── sessionController.js
    │   │   └── snippetController.js
    │   ├── middleware/
    │   │   ├── errorHandler.js
    │   │   └── validate.js
    │   ├── models/
    │   │   └── Session.js      # Mongoose schema
    │   ├── routes/
    │   │   ├── sessions.js
    │   │   └── snippets.js
    │   └── app.js              # Express app setup + CORS
    ├── server.js               # Entry point
    ├── .env                    # Secrets (not committed)
    └── package.json
```

---

## Local Development

### Prerequisites

- Node.js ≥ 20
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)
- A [Firebase project](https://console.firebase.google.com) with Email/Password auth enabled
- A [Google AI Studio](https://aistudio.google.com) API key for Gemini

### 1 — Clone

```bash
git clone https://github.com/pavankumar-vh/typing.dev.git
cd typing.dev
```

### 2 — Backend

```bash
cd backend
npm install
```

Create `backend/.env` (see [Environment Variables](#environment-variables)), then:

```bash
node server.js
# API available at http://localhost:5001
```

### 3 — Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local` (see [Environment Variables](#environment-variables)), then:

```bash
npm run dev
# App available at http://localhost:5173
```

---

## Environment Variables

### `backend/.env`

```env
PORT=5001
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/typingdev
GEMINI_API_KEY=your_gemini_api_key

# Firebase Admin SDK service account fields
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Comma-separated allowed CORS origins
FRONTEND_URL=http://localhost:5173,https://typingdotdev.netlify.app
```

### `frontend/.env.local`

```env
VITE_API_URL=http://localhost:5001

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxx
```

---

## API Reference

Base URL: `https://typingdev-production.up.railway.app`

### Health

```
GET /api/health
```

Returns `{ success: true }` — used to confirm the service is running.

---

### Sessions

```
GET  /api/sessions/leaderboard   # Top scores (public)
GET  /api/sessions/my            # Authenticated user's sessions
POST /api/sessions               # Save a completed session (auth required)
```

**POST /api/sessions** body:

```json
{
  "language": "python",
  "duration": 60,
  "wpm": 84,
  "rawWpm": 91,
  "accuracy": 96.2,
  "errors": 4
}
```

All authenticated endpoints require:
```
Authorization: Bearer <firebase_id_token>
```

---

### Snippets

```
GET /api/snippets?language=python   # Fetch a code snippet
```

Returns a cached or freshly generated snippet for the given language.

---

## Deployment

### Frontend — Netlify

1. Connect the GitHub repo in Netlify
2. Set **Build command**: `npm run build` and **Publish directory**: `dist`
3. Add all `VITE_*` environment variables in Netlify → Site settings → Environment
4. The `public/_redirects` file handles SPA routing automatically:
   ```
   /* /index.html 200
   ```

### Backend — Railway

1. Create a new Railway project and connect the GitHub repo
2. Set **Root directory**: `backend`
3. Add all backend environment variables in Railway → Variables
4. Railway auto-detects `npm start` from `package.json`

Set `FRONTEND_URL` on Railway to include your Netlify domain so CORS passes:
```
FRONTEND_URL=https://typingdotdev.netlify.app
```

---

## License

MIT
