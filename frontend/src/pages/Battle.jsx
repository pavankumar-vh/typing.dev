import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext.jsx'
import { useConfig, LANGUAGES, LANG_BADGE } from '../context/ConfigContext.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''
const FONT = 'JetBrains Mono, monospace'

/*
  Battle phases:
  lobby     → choose mode (quick match / create / join)
  queuing   → waiting in quick-match queue
  waiting   → room created, waiting for opponent
  matched   → opponent found, both press ready
  countdown → 3-2-1
  active    → typing
  finished  → results
*/

export default function Battle() {
  const { user } = useAuth()
  const { language } = useConfig()
  const [searchParams] = useSearchParams()

  const [phase, setPhase] = useState('lobby')
  const [socket, setSocket] = useState(null)
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [snippet, setSnippet] = useState(null)
  const [players, setPlayers] = useState([])
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')

  // Typing state
  const [typed, setTyped] = useState('')
  const [startTime, setStartTime] = useState(null)
  const [myStats, setMyStats] = useState({ wpm: 0, accuracy: 100, progress: 0 })
  const [oppStats, setOppStats] = useState({ wpm: 0, accuracy: 100, progress: 0, finished: false })
  const [result, setResult] = useState(null)

  const typingRef = useRef(null)
  const socketRef = useRef(null)
  const progressIntervalRef = useRef(null)

  const userId = user?.uid || `anon-${Math.random().toString(36).slice(2, 8)}`
  const displayName = user?.displayName || localStorage.getItem('profile_name') || 'anonymous'

  // Connect socket on mount
  useEffect(() => {
    const s = io(`${API_BASE}/battle`, { transports: ['websocket', 'polling'] })
    setSocket(s)
    socketRef.current = s

    s.on('connect_error', () => setError('Connection failed. Is the server running?'))

    s.on('battle:opponent-joined', ({ players: p, snippet: sn }) => {
      setPlayers(p)
      setSnippet(sn)
      setPhase('matched')
    })

    s.on('battle:matched', ({ roomCode: rc, players: p, snippet: sn }) => {
      setRoomCode(rc)
      setPlayers(p)
      setSnippet(sn)
      setPhase('matched')
    })

    s.on('battle:countdown', ({ seconds }) => {
      setPhase('countdown')
      setCountdown(seconds)
      let c = seconds
      const iv = setInterval(() => {
        c--
        setCountdown(c)
        if (c <= 0) clearInterval(iv)
      }, 1000)
    })

    s.on('battle:start', ({ snippet: sn }) => {
      setSnippet(sn)
      setPhase('active')
      setStartTime(Date.now())
      setTyped('')
    })

    s.on('battle:opponent-progress', ({ progress, wpm, accuracy }) => {
      setOppStats({ wpm, accuracy, progress, finished: false })
    })

    s.on('battle:opponent-finished', ({ stats }) => {
      setOppStats(prev => ({ ...prev, ...stats, finished: true, progress: 100 }))
    })

    s.on('battle:result', ({ players: p, winnerId }) => {
      setResult({ players: p, winnerId })
      setPhase('finished')
      clearInterval(progressIntervalRef.current)
    })

    s.on('battle:opponent-disconnected', () => {
      if (phase !== 'finished') {
        setError('Opponent disconnected')
        setPhase('lobby')
      }
    })

    // Auto-join if opponent param is set
    const opp = searchParams.get('opponent')
    if (opp) {
      // Create a room targeting that opponent (they'll need the code)
    }

    return () => {
      s.disconnect()
      clearInterval(progressIntervalRef.current)
    }
  }, [])

  // ── Actions ──────────────────────────────────────────
  function createRoom() {
    if (!socket) return
    setError('')
    socket.emit('battle:create', { userId, displayName, language }, (res) => {
      if (res.ok) {
        setRoomCode(res.roomCode)
        setPhase('waiting')
      } else {
        setError(res.error)
      }
    })
  }

  function joinRoom() {
    if (!socket || !joinCode.trim()) return
    setError('')
    socket.emit('battle:join', { roomCode: joinCode.trim().toUpperCase(), userId, displayName }, (res) => {
      if (res.ok) {
        setRoomCode(joinCode.trim().toUpperCase())
        if (res.snippet) setSnippet(res.snippet)
      } else {
        setError(res.error)
      }
    })
  }

  function quickMatch() {
    if (!socket) return
    setError('')
    socket.emit('battle:quick', { userId, displayName, language }, (res) => {
      if (res.ok) {
        if (res.queued) {
          setPhase('queuing')
        } else {
          setRoomCode(res.roomCode)
        }
      } else {
        setError(res.error)
      }
    })
  }

  function readyUp() {
    if (!socket || !roomCode) return
    socket.emit('battle:ready', { roomCode })
  }

  // ── Typing handler ──────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (phase !== 'active' || !snippet) return

    const code = snippet.content
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return
    e.preventDefault()

    setTyped(prev => {
      let next = prev
      if (e.key === 'Backspace') {
        next = prev.slice(0, -1)
      } else if (e.key === 'Tab') {
        next = prev + '  '
      } else if (e.key === 'Enter') {
        next = prev + '\n'
      } else if (e.key.length === 1) {
        next = prev + e.key
      }

      // Calculate stats
      const elapsed = Date.now() - startTime
      const correct = [...next].filter((ch, i) => ch === code[i]).length
      const totalTyped = next.length
      const wpm = elapsed > 0 ? Math.round((correct / 5) / (elapsed / 60000)) : 0
      const accuracy = totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 100
      const progress = Math.round((next.length / code.length) * 100)

      setMyStats({ wpm, accuracy, progress })

      // Send progress
      socketRef.current?.emit('battle:progress', { roomCode, userId, progress, wpm, accuracy })

      // Check if finished
      if (next.length >= code.length) {
        const finalStats = { wpm, rawWpm: wpm, accuracy, errors: totalTyped - correct }
        socketRef.current?.emit('battle:finish', { roomCode, userId, stats: finalStats })
        setMyStats({ wpm, accuracy, progress: 100 })
      }

      return next
    })
  }, [phase, snippet, startTime, roomCode, userId])

  useEffect(() => {
    if (phase === 'active') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [phase, handleKeyDown])

  // Focus indicator
  useEffect(() => {
    if (phase === 'active' && typingRef.current) typingRef.current.focus()
  }, [phase])

  function resetBattle() {
    socketRef.current?.emit('battle:leave')
    setPhase('lobby')
    setRoomCode('')
    setJoinCode('')
    setSnippet(null)
    setPlayers([])
    setTyped('')
    setStartTime(null)
    setMyStats({ wpm: 0, accuracy: 100, progress: 0 })
    setOppStats({ wpm: 0, accuracy: 100, progress: 0, finished: false })
    setResult(null)
    setError('')
  }

  // ── Render helpers ─────────────────────────────────
  const me = players.find(p => p.userId === userId)
  const opponent = players.find(p => p.userId !== userId)

  return (
    <motion.div
      className="page-wrap"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{ width: '100%', maxWidth: 720 }}>

        {/* Header */}
        <div className="page-header">
          <div className="page-header-prompt">
            <span className="page-header-dot" />
            <span>&gt; battle</span>
          </div>
          <h1>1v1 arena</h1>
          <div className="page-header-divider" />
        </div>

        {error && (
          <div className="battle-error">{error}</div>
        )}

        <AnimatePresence mode="wait">
          {/* ── LOBBY ─────────────────────────────────── */}
          {phase === 'lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="battle-lobby"
            >
              {!user && (
                <div className="battle-auth-warning">
                  ⚠ log in to track battle stats
                </div>
              )}

              {/* Quick match */}
              <button onClick={quickMatch} className="battle-action-btn battle-quick-btn">
                <span className="battle-btn-icon">⚡</span>
                <div>
                  <div className="battle-btn-title">quick match</div>
                  <div className="battle-btn-desc">find an opponent instantly · {language}</div>
                </div>
              </button>

              {/* Create room */}
              <button onClick={createRoom} className="battle-action-btn battle-create-btn">
                <span className="battle-btn-icon">+</span>
                <div>
                  <div className="battle-btn-title">create room</div>
                  <div className="battle-btn-desc">get a code · share it with a friend</div>
                </div>
              </button>

              {/* Join room */}
              <div className="battle-join-section">
                <span className="battle-btn-icon" style={{ fontSize: 20 }}>→</span>
                <div style={{ flex: 1 }}>
                  <div className="battle-btn-title" style={{ marginBottom: 8 }}>join room</div>
                  <div className="battle-join-row">
                    <input
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ROOM CODE"
                      maxLength={6}
                      className="battle-code-input"
                      onKeyDown={e => { if (e.key === 'Enter') joinRoom() }}
                    />
                    <button
                      onClick={joinRoom}
                      disabled={joinCode.length < 6}
                      className="battle-join-btn"
                    >
                      join
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── QUEUING ───────────────────────────────── */}
          {phase === 'queuing' && (
            <motion.div
              key="queuing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="battle-waiting"
            >
              <div className="battle-pulse-ring" />
              <div className="battle-waiting-text">searching for opponent...</div>
              <div className="battle-waiting-sub">{language} · quick match</div>
              <button onClick={resetBattle} className="battle-cancel-btn">cancel</button>
            </motion.div>
          )}

          {/* ── WAITING (room created) ────────────────── */}
          {phase === 'waiting' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="battle-waiting"
            >
              <div className="battle-room-code-label">room code</div>
              <div className="battle-room-code">{roomCode}</div>
              <div className="battle-waiting-sub">share this code with your opponent</div>
              <div className="battle-pulse-ring" />
              <div className="battle-waiting-text">waiting for opponent...</div>
              <button onClick={resetBattle} className="battle-cancel-btn">cancel</button>
            </motion.div>
          )}

          {/* ── MATCHED (both players, ready up) ──────── */}
          {phase === 'matched' && (
            <motion.div
              key="matched"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="battle-matched"
            >
              <div className="battle-vs-row">
                <div className="battle-player-card">
                  <div className="battle-player-avatar">
                    {(displayName || '?')[0].toUpperCase()}
                  </div>
                  <div className="battle-player-name">{displayName}</div>
                  <div className="battle-player-label">you</div>
                </div>

                <div className="battle-vs">VS</div>

                <div className="battle-player-card">
                  <div className="battle-player-avatar battle-player-avatar-opp">
                    {(opponent?.displayName || '?')[0].toUpperCase()}
                  </div>
                  <div className="battle-player-name">{opponent?.displayName || '...'}</div>
                  <div className="battle-player-label">opponent</div>
                </div>
              </div>

              {snippet && (
                <div className="battle-snippet-preview">
                  <span style={{ opacity: 0.3 }}>{snippet.language}</span>
                  <span style={{ opacity: 0.2 }}> · </span>
                  <span style={{ opacity: 0.3 }}>{snippet.content.split('\n').length} lines</span>
                </div>
              )}

              <button onClick={readyUp} className="battle-ready-btn">
                ready
              </button>
            </motion.div>
          )}

          {/* ── COUNTDOWN ─────────────────────────────── */}
          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="battle-countdown"
            >
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="battle-countdown-num"
              >
                {countdown > 0 ? countdown : 'GO!'}
              </motion.div>
            </motion.div>
          )}

          {/* ── ACTIVE TYPING ─────────────────────────── */}
          {phase === 'active' && snippet && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Progress bars */}
              <div className="battle-progress-section">
                <div className="battle-progress-row">
                  <span className="battle-progress-name">{displayName}</span>
                  <div className="battle-progress-bar">
                    <motion.div
                      className="battle-progress-fill battle-progress-fill-me"
                      animate={{ width: `${myStats.progress}%` }}
                      transition={{ duration: 0.15 }}
                    />
                  </div>
                  <span className="battle-progress-wpm">{myStats.wpm}</span>
                </div>
                <div className="battle-progress-row">
                  <span className="battle-progress-name battle-opp-name">{opponent?.displayName || 'opponent'}</span>
                  <div className="battle-progress-bar">
                    <motion.div
                      className="battle-progress-fill battle-progress-fill-opp"
                      animate={{ width: `${oppStats.progress}%` }}
                      transition={{ duration: 0.15 }}
                    />
                  </div>
                  <span className="battle-progress-wpm battle-opp-name">{oppStats.wpm}</span>
                </div>
              </div>

              {/* Typing area */}
              <div
                className="battle-code-area"
                ref={typingRef}
                tabIndex={0}
              >
                <pre className="battle-code-pre">
                  {snippet.content.split('').map((ch, i) => {
                    let cls = 'battle-char-pending'
                    if (i < typed.length) {
                      cls = typed[i] === ch ? 'battle-char-correct' : 'battle-char-wrong'
                    } else if (i === typed.length) {
                      cls = 'battle-char-cursor'
                    }
                    return <span key={i} className={cls}>{ch === '\n' ? '↵\n' : ch}</span>
                  })}
                </pre>
                <div className="page-scanline" />
              </div>

              {/* Live stats */}
              <div className="battle-live-stats">
                <div><span className="battle-stat-label">wpm</span> <span className="battle-stat-val">{myStats.wpm}</span></div>
                <div><span className="battle-stat-label">acc</span> <span className="battle-stat-val">{myStats.accuracy}%</span></div>
                <div><span className="battle-stat-label">progress</span> <span className="battle-stat-val">{myStats.progress}%</span></div>
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ───────────────────────────────── */}
          {phase === 'finished' && result && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="battle-results"
            >
              {/* Winner banner */}
              <div className="battle-winner-banner">
                {result.winnerId === userId ? (
                  <>
                    <div className="battle-trophy">🏆</div>
                    <div className="battle-winner-text">victory!</div>
                  </>
                ) : (
                  <>
                    <div className="battle-trophy">💀</div>
                    <div className="battle-loser-text">defeated</div>
                  </>
                )}
              </div>

              {/* Comparison table */}
              <div className="battle-compare">
                {result.players.map(p => {
                  const isMe = p.userId === userId
                  const isWinner = p.userId === result.winnerId
                  return (
                    <div key={p.userId} className={`battle-compare-card ${isWinner ? 'battle-compare-winner' : ''}`}>
                      <div className="battle-compare-name">
                        {p.displayName}
                        {isWinner && <span className="battle-crown">👑</span>}
                      </div>
                      <div className="battle-compare-stat">
                        <span className="battle-compare-val-big">{p.wpm}</span>
                        <span className="battle-compare-label">wpm</span>
                      </div>
                      <div className="battle-compare-row">
                        <div>
                          <span className="battle-compare-val">{p.accuracy}%</span>
                          <span className="battle-compare-label">accuracy</span>
                        </div>
                        <div>
                          <span className="battle-compare-val">{p.rawWpm}</span>
                          <span className="battle-compare-label">raw</span>
                        </div>
                        <div>
                          <span className="battle-compare-val">{p.errors}</span>
                          <span className="battle-compare-label">errors</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button onClick={resetBattle} className="battle-rematch-btn">
                new battle
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
