# Typing.dev — Backend API

REST API for session tracking, leaderboard, and stats.

## Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 4
- **Database**: MongoDB + Mongoose 8
- **No authentication** (V1)

## Getting Started

```bash
cd backend
npm install
cp .env.example .env   # fill in your MONGO_URI
npm run dev
```

## Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                   ← Mongoose connection
│   ├── models/
│   │   └── Session.js              ← Session schema + indexes
│   ├── controllers/
│   │   └── sessionController.js    ← all route handlers
│   ├── routes/
│   │   └── sessions.js             ← Express Router
│   ├── middleware/
│   │   ├── validate.js             ← request body validator
│   │   └── errorHandler.js         ← global error handler
│   └── app.js                      ← Express app setup
├── server.js                       ← entry point
├── .env.example
└── package.json
```

## API Reference

Base URL: `http://localhost:5000`

### Health

| Method | Path         | Description       |
|--------|--------------|-------------------|
| GET    | /api/health  | Server status     |

### Sessions

| Method | Path                      | Description                                    |
|--------|---------------------------|------------------------------------------------|
| POST   | /api/sessions             | Save a completed session                       |
| GET    | /api/sessions             | Get sessions (see query params below)          |
| GET    | /api/sessions/leaderboard | Top 10 WPM per language                        |
| GET    | /api/sessions/stats       | Aggregate stats (avg WPM, accuracy, totals)    |
| GET    | /api/sessions/:id         | Get single session by ID                       |

#### GET /api/sessions — Query Params

| Param    | Type   | Default  | Description                          |
|----------|--------|----------|--------------------------------------|
| language | string | —        | Filter by language (js/python/java)  |
| limit    | number | 50       | Max results                          |
| sort     | string | newest   | `newest` or `top` (by WPM)           |

#### POST /api/sessions — Request Body

```json
{
  "language": "javascript",
  "duration": 60,
  "wpm": 87,
  "rawWpm": 95,
  "accuracy": 94,
  "errors": 5,
  "snippetId": "js-2"
}
```

#### Response shape

```json
{
  "success": true,
  "data": { ... }
}
```

Errors return `{ "success": false, "error": "message" }` with appropriate HTTP status.

## Session Schema

| Field     | Type   | Required | Notes                           |
|-----------|--------|----------|---------------------------------|
| language  | String | ✓        | javascript / python / java      |
| duration  | Number | ✓        | 15 / 30 / 60 / 120              |
| wpm       | Number | ✓        | correct chars / 5 / minutes     |
| rawWpm    | Number | ✓        | all chars / 5 / minutes         |
| accuracy  | Number | ✓        | 0–100                           |
| errors    | Number | ✓        | wrong keystrokes                |
| snippetId | String | ✓        | e.g. "js-2"                     |
| createdAt | Date   |          | auto-set by Mongoose            |

