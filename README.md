<div align="center">

# ⌨ typing.dev

### A terminal-themed typing trainer built for developers — not typists.

Practice typing real code in **JavaScript · TypeScript · Python · Java · Go · Rust · C++**.<br>
Compete in real-time 1v1 battles. Track your improvement. Let AI keep your drills fresh.

**[Live Demo →](https://typingdotdev.netlify.app)**

<br>

![CRT terminal aesthetic](docs/screenshots/hero.png)

</div>

---

## Screenshots

<table>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/typing-test.png" alt="Typing Test" /><br>
      <strong>Typing Test</strong><br>
      <sub>Live WPM, accuracy, error highlighting, smooth WPM chart</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/battle-active.png" alt="1v1 Battle" /><br>
      <strong>1v1 Battle Arena</strong><br>
      <sub>Real-time PvP with progress bars, timer, and live opponent stats</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/screenshots/battle-results.png" alt="Battle Results" /><br>
      <strong>Battle Results</strong><br>
      <sub>Score breakdown with rank (D→S+), WPM comparison, quick rematch</sub>
    </td>
    <td align="center">
      <img src="docs/screenshots/leaderboard.png" alt="Leaderboard" /><br>
      <strong>Leaderboard</strong><br>
      <sub>Global rankings with podium, filterable by language</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/screenshots/profile.png" alt="Profile" /><br>
      <strong>Profile</strong><br>
      <sub>GitHub-style activity heatmap, per-language stats, customizable colors</sub>
    </td>
  </tr>
</table>

---

## Demo

<div align="center">

<!-- Replace the link below with your demo video URL (YouTube, Loom, etc.) -->

[![Watch the demo](docs/screenshots/hero.png)](https://youtube.com/watch?v=YOUR_VIDEO_ID)

*Click the image above to watch the full demo video*

</div>

---

## Features

### Typing Engine
- Character-by-character validation with instant visual feedback
- Live **WPM**, **raw WPM**, **accuracy**, and **error count**
- Smooth Catmull-Rom WPM chart rendered in real time
- **Tab** → new snippet &nbsp;|&nbsp; **Esc** → restart same snippet
- Timer modes: **15s · 30s · 60s · 120s**
- Difficulty levels: **easy · medium · hard**
- 7 languages: **JavaScript · TypeScript · Python · Java · Go · Rust · C++**

### 1v1 Battle Arena
- **Quick match** — finds an opponent or spawns a bot after 6s
- **Private rooms** — create a room code, share a link
- **Challenge system** — challenge any player from their profile page
- **In-app notifications** — opponents see a ⚔ bell with pending challenges
- Real-time progress bars, opponent WPM, and live score tracking
- Score system with ranks: **D → C → B → A → S → S+**
- Bot opponents simulate realistic typing at 35–70 WPM
- 60-second server-authoritative timer

### AI-Powered Snippets
- Code snippets generated via **Google Gemini API**
- Realistic, syntax-valid, and language-specific
- Cached in MongoDB — fresh generation on demand

### Authentication & Profiles
- **Firebase Auth** — email/password sign-up and login
- Editable display name and color customization
- **Public profiles** with shareable URLs (`/profile/:userId`)
- GitHub-style **activity heatmap** on profile pages

### Leaderboard & Stats
- Global rankings with **podium** display (gold/silver/bronze)
- Filter by language and test duration
- Personal analytics dashboard: per-language breakdowns, consistency tracking
- Full session history with sorting and filtering

### Design
- **CRT phosphor terminal aesthetic** — `#00FF41` on black
- JetBrains Mono monospace font throughout
- Scanline + vignette + phosphor glow CSS effects
- Boot screen animation on first load
- Custom cursor glow effect
- Fully responsive, dark-only
- Animated page transitions via **Framer Motion**

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
| Socket.io Client | 4 | Real-time battle communication |
| Firebase SDK | 12 | Auth client |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥20 | Runtime |
| Express | 4 | HTTP server and routing |
| Socket.io | 4 | WebSocket server for battles |
| Mongoose | 8 | MongoDB ODM |
| MongoDB Atlas | — | Hosted database |
| Firebase Admin SDK | 13 | Server-side token verification |
| Google Generative AI | 0.24 | Gemini snippet generation |

### Infrastructure

| Layer | Service |
|-------|---------|
| Frontend hosting | [Netlify](https://typingdotdev.netlify.app) |
| Backend hosting | [Railway](https://typingdev-production.up.railway.app) |
| Database | MongoDB Atlas |
| Auth | Firebase |
| AI | Google Gemini API |

---

## Architecture

```
Browser
  │
  ├─ React SPA (Netlify CDN)
  │    ├─ Firebase Auth SDK  ──────────────► Firebase Auth
  │    ├─ REST API calls     ──────┐
  │    └─ Socket.io client   ───┐  │
  │                             │  │
  │                             ▼  ▼
  │                     Express API (Railway)
  │                          ├─ /api/sessions     ──► MongoDB Atlas
  │                          ├─ /api/snippets     ──► MongoDB + Gemini API
  │                          ├─ /api/challenges   ──► MongoDB Atlas
  │                          └─ /battle (Socket.io namespace)
  │                               ├─ Quick match queue
  │                               ├─ Room management
  │                               ├─ Bot simulation
  │                               └─ Server-side timer
  │
  └─ Static assets served by Netlify
```

**Auth flow:** Firebase issues a JWT on login → frontend sends `Authorization: Bearer <token>` → backend verifies via Firebase Admin SDK.

**Battle flow:** Socket.io `/battle` namespace handles matchmaking, countdown, real-time progress sync, and result calculation server-side.

---

## Project Structure

```
typing.dev/
├── docs/
│   └── screenshots/            # README images (add your own)
│
├── frontend/
│   ├── public/
│   │   └── _redirects          # Netlify SPA routing
│   └── src/
│       ├── components/
│       │   ├── BootScreen.jsx  # CRT boot animation
│       │   └── CursorGlow.jsx  # Custom cursor effect
│       ├── config/
│       │   └── firebase.js     # Firebase client init
│       ├── context/
│       │   ├── AuthContext.jsx  # Firebase auth state
│       │   └── ConfigContext.jsx # Language/duration prefs
│       ├── pages/
│       │   ├── Landing.jsx     # Hero / marketing page
│       │   ├── Home.jsx        # Main typing test (/test)
│       │   ├── Battle.jsx      # 1v1 arena (/battle)
│       │   ├── Leaderboard.jsx # Global rankings
│       │   ├── Players.jsx     # Player search + discovery
│       │   ├── Stats.jsx       # Analytics dashboard
│       │   ├── MyStats.jsx     # Personal breakdown
│       │   ├── History.jsx     # Session history log
│       │   ├── Profile.jsx     # Own profile + settings
│       │   ├── PublicProfile.jsx # Other players' profiles
│       │   ├── Login.jsx       # Auth — login
│       │   └── Signup.jsx      # Auth — registration
│       ├── utils/
│       │   ├── metrics.js      # WPM + accuracy calc
│       │   └── snippetApi.js   # Snippet fetch helper
│       ├── App.jsx             # Router, nav, layout
│       ├── main.jsx            # Entry point
│       └── index.css           # Tailwind v4 + CRT tokens
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
    │   │   ├── Session.js      # Typing sessions
    │   │   ├── Battle.js       # Battle rooms + players
    │   │   └── Challenge.js    # PvP challenge notifications
    │   ├── routes/
    │   │   ├── sessions.js     # /api/sessions
    │   │   ├── snippets.js     # /api/snippets
    │   │   └── challenges.js   # /api/challenges
    │   ├── socket/
    │   │   └── battleSocket.js # Socket.io battle handler
    │   └── app.js              # Express app setup + CORS
    ├── server.js               # Entry point
    └── package.json
```

---

## Local Development

### Prerequisites

- **Node.js** ≥ 20
- **MongoDB Atlas** cluster ([free tier](https://www.mongodb.com/atlas))
- **Firebase project** with Email/Password auth ([console](https://console.firebase.google.com))
- **Gemini API key** from [Google AI Studio](https://aistudio.google.com)

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
# API + Socket.io at http://localhost:5001
```

### 3 — Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local` (see [Environment Variables](#environment-variables)), then:

```bash
npm run dev
# App at http://localhost:5173
```

---

## Environment Variables

### `backend/.env`

```env
PORT=5001
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/typingdev
GEMINI_API_KEY=your_gemini_api_key

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# CORS origins (comma-separated)
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

### Sessions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/sessions/leaderboard` | No | Global top scores by language |
| `GET` | `/api/sessions/leaderboard/users` | No | User rankings |
| `GET` | `/api/sessions/my` | Yes | Current user's sessions |
| `POST` | `/api/sessions` | Yes | Save a completed session |
| `GET` | `/api/sessions/stats` | No | Aggregate stats |
| `GET` | `/api/sessions/users/search?q=` | No | Search users by name |
| `GET` | `/api/sessions/users/:userId` | No | Get user profile |

### Snippets

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/snippets/languages` | No | List supported languages |
| `POST` | `/api/snippets/generate` | No | Generate a fresh AI snippet |

### Challenges

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/challenges` | No | Send a battle challenge |
| `GET` | `/api/challenges/:userId` | No | Get pending challenges for user |
| `PATCH` | `/api/challenges/:id` | No | Accept or decline a challenge |

### Battle (Socket.io)

Namespace: `/battle`

| Event | Direction | Description |
|-------|-----------|-------------|
| `battle:create` | Client → Server | Create a private room |
| `battle:join` | Client → Server | Join an existing room by code |
| `battle:quick` | Client → Server | Enter quick match queue |
| `battle:ready` | Client → Server | Signal ready to start |
| `battle:progress` | Client → Server | Send typing progress |
| `battle:finish` | Client → Server | Signal typing finished |
| `battle:leave` | Client → Server | Leave current room |
| `battle:matched` | Server → Client | Opponent found (room, players, snippet) |
| `battle:countdown` | Server → Client | 3-2-1 countdown |
| `battle:start` | Server → Client | Battle begins |
| `battle:opponent-progress` | Server → Client | Opponent's live stats |
| `battle:opponent-finished` | Server → Client | Opponent completed snippet |
| `battle:result` | Server → Client | Final scores and winner |
| `battle:time-up` | Server → Client | 60s timer expired |
| `battle:opponent-disconnected` | Server → Client | Opponent left |

---

## Deployment

### Frontend — Netlify

1. Connect the GitHub repo in Netlify
2. **Build command:** `npm run build` · **Publish directory:** `dist`
3. **Base directory:** `frontend`
4. Add all `VITE_*` environment variables in Site settings → Environment
5. SPA routing handled by `public/_redirects`:
   ```
   /* /index.html 200
   ```

### Backend — Railway

1. Create a new Railway project and connect the GitHub repo
2. **Root directory:** `backend`
3. Add all backend env vars in Railway → Variables
4. Set `FRONTEND_URL` to include your Netlify domain:
   ```
   FRONTEND_URL=https://typingdotdev.netlify.app
   ```

---

## License

MIT
