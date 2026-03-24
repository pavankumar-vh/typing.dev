import crypto from 'crypto'
import { Battle } from '../models/Battle.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ── Room code generator ──────────────────────────────────
function genCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase() // 6 chars
}

// ── Generate snippet for battle ──────────────────────────
async function getSnippet(language, difficulty) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // Fallback snippet
    return {
      language,
      difficulty,
      content: `function battle() {\n  const score = 0;\n  for (let i = 0; i < 10; i++) {\n    score += Math.random();\n  }\n  return score;\n}`,
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(
      `Generate exactly 1 short ${language} code snippet for a typing battle (8-15 lines). ` +
      `Difficulty: ${difficulty}. No markdown fences, pure code only. Realistic and idiomatic.`
    )
    const text = result.response.text().trim()
      .replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '') // strip fences if present
    return { language, difficulty, content: text }
  } catch {
    return {
      language, difficulty,
      content: `function solve(n) {\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}`,
    }
  }
}

// ── Quick match queue ────────────────────────────────────
const matchQueue = new Map() // language -> { socketId, userId, displayName }

export function initBattleSocket(io) {
  const battleNsp = io.of('/battle')

  battleNsp.on('connection', (socket) => {
    let currentRoom = null

    // ── Create private room ──────────────────────────────
    socket.on('battle:create', async ({ userId, displayName, language, difficulty }, cb) => {
      try {
        const roomCode = genCode()
        const snippet = await getSnippet(language || 'javascript', difficulty || 'medium')
        const battle = await Battle.create({
          roomCode,
          snippet,
          players: [{ userId, displayName }],
          status: 'waiting',
        })
        currentRoom = roomCode
        socket.join(roomCode)
        cb({ ok: true, roomCode, battleId: battle._id })
      } catch (err) {
        cb({ ok: false, error: err.message })
      }
    })

    // ── Join existing room ───────────────────────────────
    socket.on('battle:join', async ({ roomCode, userId, displayName }, cb) => {
      try {
        const battle = await Battle.findOne({ roomCode, status: 'waiting' })
        if (!battle) return cb({ ok: false, error: 'Room not found or already started' })
        if (battle.players.length >= 2) return cb({ ok: false, error: 'Room is full' })
        if (battle.players.some(p => p.userId === userId)) return cb({ ok: false, error: 'Already in room' })

        battle.players.push({ userId, displayName })
        await battle.save()

        currentRoom = roomCode
        socket.join(roomCode)

        // Notify both players
        battleNsp.to(roomCode).emit('battle:opponent-joined', {
          players: battle.players.map(p => ({
            userId: p.userId,
            displayName: p.displayName,
          })),
          snippet: battle.snippet,
        })

        cb({ ok: true, snippet: battle.snippet })
      } catch (err) {
        cb({ ok: false, error: err.message })
      }
    })

    // ── Quick match ──────────────────────────────────────
    socket.on('battle:quick', async ({ userId, displayName, language }, cb) => {
      const lang = (language || 'javascript').toLowerCase()

      // Check if someone is waiting
      const waiting = matchQueue.get(lang)
      if (waiting && waiting.userId !== userId) {
        // Match found — create room and pair them
        matchQueue.delete(lang)
        const roomCode = genCode()
        const snippet = await getSnippet(lang, 'medium')

        try {
          const battle = await Battle.create({
            roomCode,
            snippet,
            players: [
              { userId: waiting.userId, displayName: waiting.displayName },
              { userId, displayName },
            ],
            status: 'waiting',
          })

          currentRoom = roomCode
          socket.join(roomCode)

          // Get the waiting player's socket and join them too
          const waitingSocket = battleNsp.sockets.get(waiting.socketId)
          if (waitingSocket) {
            waitingSocket.join(roomCode)
            waitingSocket.currentRoom = roomCode
          }

          const payload = {
            roomCode,
            players: battle.players.map(p => ({
              userId: p.userId,
              displayName: p.displayName,
            })),
            snippet: battle.snippet,
          }

          battleNsp.to(roomCode).emit('battle:matched', payload)
          cb({ ok: true, roomCode })
        } catch (err) {
          cb({ ok: false, error: err.message })
        }
      } else {
        // No one waiting — add to queue
        matchQueue.set(lang, { socketId: socket.id, userId, displayName })
        cb({ ok: true, queued: true })
      }
    })

    // ── Player ready (both ready → countdown) ────────────
    socket.on('battle:ready', async ({ roomCode }) => {
      const battle = await Battle.findOne({ roomCode })
      if (!battle || battle.players.length < 2) return

      // Start countdown
      battle.status = 'countdown'
      await battle.save()

      battleNsp.to(roomCode).emit('battle:countdown', { seconds: 3 })

      // After 3 seconds, start the battle
      setTimeout(async () => {
        const b = await Battle.findOne({ roomCode })
        if (!b || b.status !== 'countdown') return
        b.status = 'active'
        b.startedAt = new Date()
        await b.save()
        battleNsp.to(roomCode).emit('battle:start', {
          snippet: b.snippet,
          startedAt: b.startedAt,
        })
      }, 3000)
    })

    // ── Real-time progress update ────────────────────────
    socket.on('battle:progress', ({ roomCode, userId, progress, wpm, accuracy }) => {
      // Broadcast to opponent only
      socket.to(roomCode).emit('battle:opponent-progress', {
        userId, progress, wpm, accuracy,
      })
    })

    // ── Player finished ──────────────────────────────────
    socket.on('battle:finish', async ({ roomCode, userId, stats }) => {
      try {
        const battle = await Battle.findOne({ roomCode })
        if (!battle) return

        const player = battle.players.find(p => p.userId === userId)
        if (!player || player.finished) return

        player.wpm = stats.wpm
        player.rawWpm = stats.rawWpm
        player.accuracy = stats.accuracy
        player.errors = stats.errors
        player.progress = 100
        player.finished = true
        player.finishedAt = new Date()

        // Check if both finished
        const allDone = battle.players.every(p => p.finished)
        if (allDone) {
          battle.status = 'finished'
          battle.finishedAt = new Date()

          // Determine winner (higher WPM wins, tie goes to better accuracy)
          const [p1, p2] = battle.players
          if (p1.wpm > p2.wpm || (p1.wpm === p2.wpm && p1.accuracy >= p2.accuracy)) {
            battle.winnerId = p1.userId
          } else {
            battle.winnerId = p2.userId
          }
        }

        await battle.save()

        if (allDone) {
          battleNsp.to(roomCode).emit('battle:result', {
            players: battle.players,
            winnerId: battle.winnerId,
          })
        } else {
          // Notify opponent that this player finished
          socket.to(roomCode).emit('battle:opponent-finished', {
            userId,
            stats: { wpm: stats.wpm, accuracy: stats.accuracy },
          })
        }
      } catch (err) {
        console.error('[battle] finish error:', err.message)
      }
    })

    // ── Disconnect / cleanup ─────────────────────────────
    socket.on('disconnect', async () => {
      // Remove from match queue
      for (const [lang, entry] of matchQueue.entries()) {
        if (entry.socketId === socket.id) {
          matchQueue.delete(lang)
          break
        }
      }

      // Notify room if in an active battle
      if (currentRoom) {
        socket.to(currentRoom).emit('battle:opponent-disconnected')
      }
    })

    // ── Leave room ───────────────────────────────────────
    socket.on('battle:leave', () => {
      if (currentRoom) {
        socket.to(currentRoom).emit('battle:opponent-disconnected')
        socket.leave(currentRoom)
        currentRoom = null
      }
    })
  })
}
