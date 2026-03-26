import crypto from 'crypto'
import { Battle } from '../models/Battle.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ── Room code generator ──────────────────────────────────
function genCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase()
}

// ── Generate snippet for battle ──────────────────────────
async function getSnippet(language, difficulty) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
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
      .replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '')
    return { language, difficulty, content: text }
  } catch {
    return {
      language, difficulty,
      content: `function solve(n) {\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}`,
    }
  }
}

// ── Score calculator ─────────────────────────────────────
function calcScore(stats) {
  const wpmScore = Math.round(stats.wpm * 10)
  const accBonus = Math.round(stats.accuracy * 0.5)
  const speedBonus = stats.wpm >= 80 ? 50 : stats.wpm >= 60 ? 30 : stats.wpm >= 40 ? 15 : 0
  const perfectBonus = stats.accuracy === 100 ? 100 : stats.accuracy >= 98 ? 50 : 0
  return wpmScore + accBonus + speedBonus + perfectBonus
}

// ── Bot names ────────────────────────────────────────────
const BOT_NAMES = [
  'syntax_bot', 'type_ghost', 'code_phantom', 'bit_runner',
  'null_ptr', 'byte_blitz', 'algo_core', 'cpu_fingers',
  'turing_jr', 'lambda_bot', 'vim_master', 'gcc_turbo',
]
function randomBotName() {
  return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
}

// ── Quick match queue ────────────────────────────────────
const matchQueue = new Map()
const activeTimers = new Map()
const botIntervals = new Map()
const socketRooms = new Map()

const BOT_WAIT_MS = 6000
const BATTLE_DURATION = 60

export function initBattleSocket(io) {
  const battleNsp = io.of('/battle')

  battleNsp.on('connection', (socket) => {
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
        socketRooms.set(socket.id, roomCode)
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

        socketRooms.set(socket.id, roomCode)
        socket.join(roomCode)

        battleNsp.to(roomCode).emit('battle:opponent-joined', {
          roomCode,
          players: battle.players.map(p => ({
            userId: p.userId,
            displayName: p.displayName,
            isBot: p.isBot || false,
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

      const waiting = matchQueue.get(lang)
      if (waiting && waiting.userId !== userId) {
        if (waiting.botTimer) clearTimeout(waiting.botTimer)
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

          socketRooms.set(socket.id, roomCode)
          socket.join(roomCode)

          const waitingSocket = battleNsp.sockets.get(waiting.socketId)
          if (waitingSocket) {
            waitingSocket.join(roomCode)
            socketRooms.set(waiting.socketId, roomCode)
          }

          const payload = {
            roomCode,
            players: battle.players.map(p => ({
              userId: p.userId,
              displayName: p.displayName,
              isBot: false,
            })),
            snippet: battle.snippet,
            isBot: false,
          }

          battleNsp.to(roomCode).emit('battle:matched', payload)
          cb({ ok: true, roomCode })
        } catch (err) {
          cb({ ok: false, error: err.message })
        }
      } else {
        const botTimer = setTimeout(async () => {
          const entry = matchQueue.get(lang)
          if (!entry || entry.socketId !== socket.id) return
          matchQueue.delete(lang)

          const roomCode = genCode()
          const botId = `bot-${crypto.randomBytes(4).toString('hex')}`
          const botName = randomBotName()
          const snippet = await getSnippet(lang, 'medium')

          try {
            const battle = await Battle.create({
              roomCode,
              snippet,
              players: [
                { userId, displayName },
                { userId: botId, displayName: botName, isBot: true },
              ],
              status: 'waiting',
            })

            socketRooms.set(socket.id, roomCode)
            socket.join(roomCode)

            const payload = {
              roomCode,
              players: battle.players.map(p => ({
                userId: p.userId,
                displayName: p.displayName,
                isBot: p.isBot || false,
              })),
              snippet: battle.snippet,
              isBot: true,
            }

            socket.emit('battle:matched', payload)
          } catch (err) {
            console.error('[battle] bot spawn error:', err.message)
          }
        }, BOT_WAIT_MS)

        matchQueue.set(lang, { socketId: socket.id, userId, displayName, botTimer })
        cb({ ok: true, queued: true })
      }
    })

    // ── Player ready ─────────────────────────────────────
    socket.on('battle:ready', async ({ roomCode }) => {
      const battle = await Battle.findOneAndUpdate(
        { roomCode, status: 'waiting', 'players.1': { $exists: true } },
        { $set: { status: 'countdown' } },
        { new: true }
      )
      if (!battle) return

      battleNsp.to(roomCode).emit('battle:countdown', { seconds: 3 })

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

        // Server-side battle timer
        const timerId = setTimeout(async () => {
          activeTimers.delete(roomCode)
          const bt = await Battle.findOne({ roomCode })
          if (!bt || bt.status !== 'active') return

          bt.players.forEach(p => {
            if (!p.finished) {
              p.finished = true
              p.finishedAt = new Date()
              p.score = calcScore(p)
            }
          })
          bt.status = 'finished'
          bt.finishedAt = new Date()

          const [p1, p2] = bt.players
          p1.score = calcScore(p1)
          p2.score = calcScore(p2)
          if (p1.score === p2.score) {
            bt.winnerId = null
          } else {
            bt.winnerId = p1.score > p2.score ? p1.userId : p2.userId
          }
          await bt.save()

          if (botIntervals.has(roomCode)) {
            clearInterval(botIntervals.get(roomCode))
            botIntervals.delete(roomCode)
          }

          battleNsp.to(roomCode).emit('battle:time-up')
          battleNsp.to(roomCode).emit('battle:result', {
            players: bt.players,
            winnerId: bt.winnerId,
            isDraw: bt.winnerId === null,
          })
        }, BATTLE_DURATION * 1000)
        activeTimers.set(roomCode, timerId)

        // Bot simulation
        const botPlayer = b.players.find(p => p.isBot)
        if (botPlayer) {
          startBotSimulation(battleNsp, roomCode, botPlayer, b.snippet.content)
        }
      }, 3000)
    })

    // ── Real-time progress update ────────────────────────
    socket.on('battle:progress', ({ roomCode, userId, progress, wpm, accuracy }) => {
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
        player.score = calcScore(stats)

        const allDone = battle.players.every(p => p.finished)
        if (allDone) {
          battle.status = 'finished'
          battle.finishedAt = new Date()

          battle.players.forEach(p => {
            if (!p.score) p.score = calcScore(p)
          })

          const [p1, p2] = battle.players
          if (p1.score === p2.score) {
            battle.winnerId = null
          } else {
            battle.winnerId = p1.score > p2.score ? p1.userId : p2.userId
          }

          if (activeTimers.has(roomCode)) {
            clearTimeout(activeTimers.get(roomCode))
            activeTimers.delete(roomCode)
          }
          if (botIntervals.has(roomCode)) {
            clearInterval(botIntervals.get(roomCode))
            botIntervals.delete(roomCode)
          }
        }

        await battle.save()

        if (allDone) {
          battleNsp.to(roomCode).emit('battle:result', {
            players: battle.players,
            winnerId: battle.winnerId,
            isDraw: battle.winnerId === null,
          })
        } else {
          socket.to(roomCode).emit('battle:opponent-finished', {
            userId,
            stats: { wpm: stats.wpm, accuracy: stats.accuracy, score: player.score },
          })
        }
      } catch (err) {
        console.error('[battle] finish error:', err.message)
      }
    })

    // ── Disconnect / cleanup ─────────────────────────────
    socket.on('disconnect', async () => {
      for (const [lang, entry] of matchQueue.entries()) {
        if (entry.socketId === socket.id) {
          if (entry.botTimer) clearTimeout(entry.botTimer)
          matchQueue.delete(lang)
          break
        }
      }

      const currentRoom = socketRooms.get(socket.id)
      if (currentRoom) {
        socketRooms.delete(socket.id)
        socket.to(currentRoom).emit('battle:opponent-disconnected')
        if (activeTimers.has(currentRoom)) {
          clearTimeout(activeTimers.get(currentRoom))
          activeTimers.delete(currentRoom)
        }
        if (botIntervals.has(currentRoom)) {
          clearInterval(botIntervals.get(currentRoom))
          botIntervals.delete(currentRoom)
        }
      }
    })

    // ── Leave room ───────────────────────────────────────
    socket.on('battle:leave', () => {
      const currentRoom = socketRooms.get(socket.id)
      if (currentRoom) {
        socket.to(currentRoom).emit('battle:opponent-disconnected')
        socket.leave(currentRoom)
        if (activeTimers.has(currentRoom)) {
          clearTimeout(activeTimers.get(currentRoom))
          activeTimers.delete(currentRoom)
        }
        if (botIntervals.has(currentRoom)) {
          clearInterval(botIntervals.get(currentRoom))
          botIntervals.delete(currentRoom)
        }
        socketRooms.delete(socket.id)
      }
    })
  })
}

// ── Bot typing simulation ────────────────────────────────
function startBotSimulation(nsp, roomCode, botPlayer, snippetContent) {
  const totalChars = snippetContent.length
  const botWpm = 35 + Math.floor(Math.random() * 36)
  const charsPerSec = (botWpm * 5) / 60
  let charsTyped = 0
  const botAccuracy = 90 + Math.floor(Math.random() * 10)

  const iv = setInterval(async () => {
    const variance = 0.5 + Math.random() * 1.5
    charsTyped = Math.min(charsTyped + charsPerSec * variance, totalChars)
    const progress = Math.min(Math.round((charsTyped / totalChars) * 100), 100)

    nsp.to(roomCode).emit('battle:opponent-progress', {
      userId: botPlayer.userId,
      progress,
      wpm: botWpm + Math.floor(Math.random() * 6 - 3),
      accuracy: botAccuracy,
    })

    if (charsTyped >= totalChars) {
      clearInterval(iv)
      botIntervals.delete(roomCode)

      const errors = Math.round(totalChars * (1 - botAccuracy / 100))
      const stats = { wpm: botWpm, rawWpm: botWpm + 3, accuracy: botAccuracy, errors }

      try {
        const battle = await Battle.findOne({ roomCode })
        if (!battle || battle.status !== 'active') return

        const bp = battle.players.find(p => p.userId === botPlayer.userId)
        if (!bp || bp.finished) return

        bp.wpm = stats.wpm
        bp.rawWpm = stats.rawWpm
        bp.accuracy = stats.accuracy
        bp.errors = stats.errors
        bp.progress = 100
        bp.finished = true
        bp.finishedAt = new Date()
        bp.score = calcScore(stats)

        const allDone = battle.players.every(p => p.finished)
        if (allDone) {
          battle.status = 'finished'
          battle.finishedAt = new Date()
          battle.players.forEach(p => { if (!p.score) p.score = calcScore(p) })
          const [p1, p2] = battle.players
          if (p1.score === p2.score) {
            battle.winnerId = null
          } else {
            battle.winnerId = p1.score > p2.score ? p1.userId : p2.userId
          }

          if (activeTimers.has(roomCode)) {
            clearTimeout(activeTimers.get(roomCode))
            activeTimers.delete(roomCode)
          }
        }

        await battle.save()

        if (allDone) {
          nsp.to(roomCode).emit('battle:result', {
            players: battle.players,
            winnerId: battle.winnerId,
            isDraw: battle.winnerId === null,
          })
        } else {
          nsp.to(roomCode).emit('battle:opponent-finished', {
            userId: botPlayer.userId,
            stats: { wpm: stats.wpm, accuracy: stats.accuracy, score: bp.score },
          })
        }
      } catch (err) {
        console.error('[battle] bot finish error:', err.message)
      }
    }
  }, 1000)

  botIntervals.set(roomCode, iv)
}
