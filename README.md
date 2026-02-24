# typing.dev

A terminal-style code typing trainer built for developers. Practice typing real code snippets in Java, Python, and JavaScript with real-time performance metrics.

## Live

| Service  | URL |
|----------|-----|
| Frontend | [typingdotdev.netlify.app](https://typingdotdev.netlify.app) |
| Backend  | [typingdev-production.up.railway.app](https://typingdev-production.up.railway.app) |

## Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion |
| Backend  | Node.js, Express, MongoDB Atlas |
| Auth     | Firebase Authentication |
| AI       | Google Gemini API |
| Hosting  | Netlify (frontend) · Railway (backend) |

## Project Structure

```
typing.dev/
├── frontend/   ← React + Vite (Netlify)
└── backend/    ← Node.js + Express (Railway)
```

## Local Development

```bash
# Backend
cd backend
npm install
node server.js        # runs on :5001

# Frontend
cd frontend
npm install
npm run dev           # runs on :5173
```

## Features

- Monkeytype-style terminal trainer
- Language selection: Java, Python, JavaScript
- Duration: 15s / 30s / 60s / 120s
- Real-time WPM, raw WPM, accuracy, error count
- Leaderboard with top scores
- User accounts, profile stats, and activity heatmap
- AI-generated code snippet rotation via Gemini
- Tab = new test · Esc = restart same snippet
- CRT scanline + phosphor glow aesthetic
