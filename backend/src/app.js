import express from 'express'
import cors from 'cors'
import sessionRoutes from './routes/sessions.js'
import snippetRoutes from './routes/snippets.js'
import { validateSession } from './middleware/validate.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

// ── Global middleware ─────────────────────────────────────
// Strict CORS — set FRONTEND_URL on the server (comma-separated for multiple).
const allowedOrigins = new Set(
  (process.env.FRONTEND_URL || '')
    .split(',').map((s) => s.trim()).filter(Boolean)
)
console.log('[cors] allowed origins:', allowedOrigins.size ? [...allowedOrigins] : '⚠ NONE — set FRONTEND_URL env var')

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)                                  // curl / server-to-server
    if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true) // local dev
    if (allowedOrigins.has(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // handle preflight for all routes
app.use(express.json())

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[req] ${req.method} ${req.path}`)
    next()
  })
}

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'typing-dev-api',
    version: '1.0.0',
  })
})

// ── Routes ────────────────────────────────────────────────
// Inject validateSession only on POST /api/sessions
app.post('/api/sessions', validateSession)
app.use('/api/sessions', sessionRoutes)
app.use('/api/snippets', snippetRoutes)

// ── 404 handler ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// ── Error handler (must be last) ─────────────────────────
app.use(errorHandler)

export default app
