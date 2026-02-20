# backend

Backend API for Typing.dev — coming soon.

## Planned Stack

- **Runtime**: Node.js
- **Framework**: Express or Fastify
- **Database**: PostgreSQL (user accounts, session history, leaderboard)
- **Auth**: JWT

## Planned Endpoints

- `POST /api/sessions` — save a completed typing session
- `GET  /api/sessions/:userId` — retrieve session history
- `GET  /api/leaderboard` — top scores by language
- `POST /api/auth/register`
- `POST /api/auth/login`

## Getting Started (future)

```bash
cd backend
npm install
npm run dev
```
