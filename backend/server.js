import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createServer } from 'http'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

import { Server as SocketIO } from 'socket.io'
import app from './src/app.js'
import { connectDB } from './src/config/db.js'
import { initBattleSocket } from './src/socket/battleSocket.js'

const PORT = process.env.PORT || 5000

async function start() {
  await connectDB()

  const httpServer = createServer(app)

  // Socket.io — allow same origins as the REST API
  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',').map(s => s.trim()).filter(Boolean)

  const io = new SocketIO(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true)
        if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true)
        if (allowedOrigins.includes(origin)) return cb(null, true)
        cb(new Error(`Socket CORS: origin ${origin} not allowed`))
      },
      methods: ['GET', 'POST'],
    },
  })

  initBattleSocket(io)

  httpServer.listen(PORT, () => {
    console.log(`[server] typing-dev-api running on http://localhost:${PORT}`)
    console.log(`[server] NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
    console.log(`[server] Socket.io ready`)
  })
}

start()
