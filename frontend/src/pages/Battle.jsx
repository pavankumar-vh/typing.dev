import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext.jsx'
import { useConfig } from '../context/ConfigContext.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''
const BATTLE_DURATION = 60

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
  const [isBot, setIsBot] = useState(false)
  const [challengeTarget, setChallengeTarget] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)

  // Typing state
  const [typed, setTyped] = useState('')
  const [startTime, setStartTime] = useState(null)
  const [myStats, setMyStats] = useState({ wpm: 0, accuracy: 100, progress: 0 })
  const [oppStats, setOppStats] = useState({ wpm: 0, accuracy: 100, progress: 0, finished: false })
  const [result, setResult] = useState(null)

  // Timer
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION)
  const timerRef = useRef(null)

  const typingRef = useRef(null)
  const mobileInputRef = useRef(null)
  const socketRef = useRef(null)
  const phaseRef = useRef('lobby')
  const finishedRef = useRef(false)

  // Stable userId — won't change across renders for anon users
  const userId = useMemo(
    () => user?.uid || `anon-${Math.random().toString(36).slice(2, 8)}`,
    [user?.uid]
  )
  const displayName = user?.displayName || localStorage.getItem('profile_name') || 'anonymous'
  const countdownIvRef = useRef(null)
  const lastProgressRef = useRef(0)
  const userIdRef = useRef(userId)
  const displayNameRef = useRef(displayName)

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { userIdRef.current = userId }, [userId])
  useEffect(() => { displayNameRef.current = displayName }, [displayName])

  // Connect socket on mount
  useEffect(() => {
    const s = io(`${API_BASE}/battle`, { transports: ['websocket', 'polling'] })
    setSocket(s)
    socketRef.current = s

    s.on('connect_error', () => setError('Connection failed. Is the server running?'))

    s.on('battle:opponent-joined', ({ players: p, snippet: sn, roomCode: rc }) => {
      setPlayers(p)
      setSnippet(sn)
      if (rc) setRoomCode(rc)
      setPhase('matched')
    })

    s.on('battle:matched', ({ roomCode: rc, players: p, snippet: sn, isBot: bot }) => {
      setRoomCode(rc)
      setPlayers(p)
      setSnippet(sn)
      if (bot) setIsBot(true)
      setPhase('matched')
      // Auto-ready for bot matches after a brief display
      if (bot) setTimeout(() => s.emit('battle:ready', { roomCode: rc }), 1200)
    })

    s.on('battle:countdown', ({ seconds }) => {
      setPhase('countdown')
      setCountdown(seconds)
      if (countdownIvRef.current) clearInterval(countdownIvRef.current)
      let c = seconds
      const iv = setInterval(() => {
        c--
        setCountdown(c)
        if (c <= 0) { clearInterval(iv); countdownIvRef.current = null }
      }, 1000)
      countdownIvRef.current = iv
    })

    s.on('battle:start', ({ snippet: sn }) => {
      setSnippet(sn)
      setPhase('active')
      setStartTime(Date.now())
      setTyped('')
      setTimeLeft(BATTLE_DURATION)
      finishedRef.current = false
    })

    s.on('battle:opponent-progress', ({ progress, wpm, accuracy }) => {
      setOppStats({ wpm, accuracy, progress, finished: false })
    })

    s.on('battle:opponent-finished', ({ stats }) => {
      setOppStats(prev => ({ ...prev, ...stats, finished: true, progress: 100 }))
    })

    s.on('battle:result', ({ players: p, winnerId, isDraw }) => {
      setResult({ players: p, winnerId, isDraw: isDraw || false })
      setPhase('finished')
      clearInterval(timerRef.current)
    })

    s.on('battle:time-up', () => {
      clearInterval(timerRef.current)
      setTimeLeft(0)
    })

    s.on('battle:opponent-disconnected', () => {
      if (phaseRef.current !== 'finished') {
        setError('Opponent disconnected')
        setPhase('lobby')
        clearInterval(timerRef.current)
      }
    })

    // Auto-create room if challenging someone from their profile
    const opp = searchParams.get('opponent')
    const joinParam = searchParams.get('room')
    if (joinParam) {
      // Auto-join a room from a shared challenge link
      setRoomCode(joinParam.toUpperCase())
      s.on('connect', () => {
        s.emit('battle:join', {
          roomCode: joinParam.toUpperCase(),
          userId: userIdRef.current,
          displayName: displayNameRef.current,
        }, (res) => {
          if (res.ok) {
            if (res.snippet) setSnippet(res.snippet)
          } else {
            setError(res.error || 'Could not join room')
          }
        })
      })
    } else if (opp) {
      // Fetch opponent name, then auto-create a room
      fetch(`${API_BASE}/api/sessions/users/${encodeURIComponent(opp)}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) setChallengeTarget(d.data.displayName)
        })
        .catch(() => {})
      s.on('connect', () => {
        s.emit('battle:create', {
          userId: userIdRef.current,
          displayName: displayNameRef.current,
          language: language || 'javascript',
        }, (res) => {
          if (res.ok) {
            setRoomCode(res.roomCode)
            setPhase('waiting')
            // Send in-app challenge notification to the opponent
            fetch(`${API_BASE}/api/challenges`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fromUserId: userIdRef.current,
                fromDisplayName: displayNameRef.current,
                toUserId: opp,
                roomCode: res.roomCode,
              }),
            }).catch(() => {})
          } else {
            setError(res.error || 'Could not create room')
          }
        })
      })
    }

    return () => {
      s.disconnect()
      clearInterval(timerRef.current)
      if (countdownIvRef.current) clearInterval(countdownIvRef.current)
    }
  }, [])

  // Client-side timer display (server is authoritative)
  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timerRef.current)
    }
  }, [phase])

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
    if (phaseRef.current !== 'active' || !snippet || finishedRef.current) return

    const code = snippet.content
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape'].includes(e.key)) return
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
      return next
    })
  }, [snippet])

  // Separate effect for stats calculation — avoid setState inside updater
  useEffect(() => {
    if (phase !== 'active' || !snippet || !startTime || finishedRef.current) return

    const code = snippet.content
    const elapsed = Date.now() - startTime
    const correct = [...typed].filter((ch, i) => ch === code[i]).length
    const totalTyped = typed.length
    const wpm = elapsed > 2000 ? Math.round((correct / 5) / (elapsed / 60000)) : 0
    const accuracy = totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 100
    const progress = Math.min(Math.round((typed.length / code.length) * 100), 100)

    setMyStats({ wpm, accuracy, progress })

    // Send progress to opponent (throttled)
    const now = Date.now()
    if (now - lastProgressRef.current >= 200) {
      lastProgressRef.current = now
      socketRef.current?.emit('battle:progress', { roomCode, userId, progress, wpm, accuracy })
    }

    // Check if finished
    if (typed.length >= code.length && !finishedRef.current) {
      finishedRef.current = true
      const errors = totalTyped - correct
      const finalStats = { wpm, rawWpm: wpm, accuracy, errors }
      socketRef.current?.emit('battle:finish', { roomCode, userId, stats: finalStats })
      setMyStats({ wpm, accuracy, progress: 100 })
    }
  }, [typed, phase, snippet, startTime, roomCode, userId])

  useEffect(() => {
    if (phase === 'active') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [phase, handleKeyDown])

  // Focus indicator
  useEffect(() => {
    if (phase === 'active') {
      typingRef.current?.focus()
      mobileInputRef.current?.focus()
    }
  }, [phase])

  // Mobile input handler — captures virtual keyboard input via hidden textarea
  const handleMobileInput = useCallback((e) => {
    if (phaseRef.current !== 'active' || !snippet || finishedRef.current) return
    const data = e.nativeEvent.data
    if (data === null || data === undefined) {
      // Backspace / deletion
      setTyped(prev => prev.slice(0, -1))
      if (mobileInputRef.current) mobileInputRef.current.value = ''
      return
    }
    const char = data.slice(-1)
    if (!char) { if (mobileInputRef.current) mobileInputRef.current.value = ''; return }
    setTyped(prev => {
      if (char === '\n') return prev + '\n'
      return prev + char
    })
    if (mobileInputRef.current) mobileInputRef.current.value = ''
  }, [snippet])

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
    setIsBot(false)
    setTimeLeft(BATTLE_DURATION)
    setChallengeTarget(null)
    setLinkCopied(false)
    finishedRef.current = false
    lastProgressRef.current = 0
    clearInterval(timerRef.current)
    if (countdownIvRef.current) { clearInterval(countdownIvRef.current); countdownIvRef.current = null }
  }

  function quickRematch() {
    resetBattle()
    setTimeout(() => quickMatch(), 100)
  }

  // ── Score helpers ──────────────────────────────────
  function calcScore(p) {
    if (!p) return 0
    const wpmScore = Math.round(p.wpm * 10)
    const accBonus = Math.round(p.accuracy * 0.5)
    const speedBonus = p.wpm >= 80 ? 50 : p.wpm >= 60 ? 30 : p.wpm >= 40 ? 15 : 0
    const perfectBonus = p.accuracy === 100 ? 100 : p.accuracy >= 98 ? 50 : 0
    return wpmScore + accBonus + speedBonus + perfectBonus
  }

  function getRank(score) {
    if (score >= 1200) return { label: 'S+', color: '#FFD700' }
    if (score >= 900)  return { label: 'S', color: '#FFD700' }
    if (score >= 700)  return { label: 'A', color: '#00FF41' }
    if (score >= 500)  return { label: 'B', color: '#00CCFF' }
    if (score >= 300)  return { label: 'C', color: '#FF9900' }
    return { label: 'D', color: '#FF4444' }
  }

  // ── Render helpers ─────────────────────────────────
  const me = players.find(p => p.userId === userId)
  const opponent = players.find(p => p.userId !== userId)

  const timerPercent = (timeLeft / BATTLE_DURATION) * 100
  const timerUrgent = timeLeft <= 10

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
          <div className="battle-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
            {error} <span style={{ opacity: 0.3, marginLeft: 8 }}>click to dismiss</span>
          </div>
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
                  <div className="battle-btn-desc">find an opponent or play a bot · {language}</div>
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
              <div className="battle-waiting-sub">{language} · auto-bot if no one joins</div>
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
              {challengeTarget && (
                <div className="battle-challenge-target">
                  challenge room for <span style={{ color: '#00FF41', fontWeight: 700 }}>{challengeTarget}</span>
                  <div style={{ fontSize: 11, color: 'rgba(0,204,53,0.25)', marginTop: 4 }}>copy the link below and send it to them</div>
                </div>
              )}
              <div className="battle-room-code-label">room code</div>
              <div className="battle-room-code">{roomCode}</div>

              {/* Shareable link */}
              <div className="battle-share-section">
                <div className="battle-waiting-sub">send this link to your opponent</div>
                <div className="battle-share-link-row">
                  <input
                    readOnly
                    value={`${window.location.origin}/battle?room=${roomCode}`}
                    className="battle-share-input"
                    onClick={e => e.target.select()}
                  />
                  <button
                    className="battle-copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/battle?room=${roomCode}`)
                      setLinkCopied(true)
                      setTimeout(() => setLinkCopied(false), 2000)
                    }}
                  >
                    {linkCopied ? '✓ copied' : 'copy'}
                  </button>
                </div>
                <div className="battle-share-or">or share the code: <strong>{roomCode}</strong></div>
              </div>

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
                  <div className={`battle-player-avatar battle-player-avatar-opp ${isBot ? 'battle-avatar-bot' : ''}`}>
                    {isBot ? '🤖' : (opponent?.displayName || '?')[0].toUpperCase()}
                  </div>
                  <div className="battle-player-name">
                    {opponent?.displayName || '...'}
                    {isBot && <span className="battle-bot-badge">BOT</span>}
                  </div>
                  <div className="battle-player-label">{isBot ? 'cpu' : 'opponent'}</div>
                </div>
              </div>

              {snippet && (
                <div className="battle-snippet-preview">
                  <span style={{ opacity: 0.3 }}>{snippet.language}</span>
                  <span style={{ opacity: 0.2 }}> · </span>
                  <span style={{ opacity: 0.3 }}>{snippet.content.split('\n').length} lines</span>
                  <span style={{ opacity: 0.2 }}> · </span>
                  <span style={{ opacity: 0.3 }}>{BATTLE_DURATION}s</span>
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
              {/* Timer bar */}
              <div className={`battle-timer ${timerUrgent ? 'battle-timer-urgent' : ''}`}>
                <div className="battle-timer-bar">
                  <motion.div
                    className="battle-timer-fill"
                    animate={{ width: `${timerPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="battle-timer-text">{timeLeft}s</span>
              </div>

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
                  <span className="battle-progress-name battle-opp-name">
                    {opponent?.displayName || 'opponent'}
                    {isBot && <span className="battle-bot-tag">bot</span>}
                  </span>
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

              {/* Opponent done tag */}
              {oppStats.finished && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="battle-opp-done-tag"
                >
                  ⚡ {opponent?.displayName || 'opponent'} finished — {oppStats.wpm} wpm
                </motion.div>
              )}

              {/* Typing area */}
              <div
                className="battle-code-area"
                ref={typingRef}
                tabIndex={0}
                onClick={() => mobileInputRef.current?.focus()}
              >
                {/* Hidden textarea for mobile keyboard */}
                <textarea
                  ref={mobileInputRef}
                  onInput={handleMobileInput}
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    opacity: 0,
                    zIndex: 5,
                    caretColor: 'transparent',
                    fontSize: '16px',
                    resize: 'none',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: 'transparent',
                  }}
                />
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
                <div><span className="battle-stat-label">score</span> <span className="battle-stat-val battle-score-live">{calcScore({ wpm: myStats.wpm, accuracy: myStats.accuracy })}</span></div>
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
                {result.isDraw ? (
                  <>
                    <div className="battle-trophy">🤝</div>
                    <div className="battle-draw-text">draw!</div>
                  </>
                ) : result.winnerId === userId ? (
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
                  const isWinner = !result.isDraw && p.userId === result.winnerId
                  const score = calcScore(p)
                  const rank = getRank(score)
                  return (
                    <div key={p.userId} className={`battle-compare-card ${isWinner ? 'battle-compare-winner' : ''}`}>
                      <div className="battle-compare-name">
                        {p.displayName}
                        {p.isBot && <span className="battle-bot-badge">BOT</span>}
                        {isWinner && <span className="battle-crown">👑</span>}
                      </div>

                      {/* Score + Rank */}
                      <div className="battle-score-row">
                        <span className="battle-score-rank" style={{ color: rank.color, borderColor: rank.color }}>{rank.label}</span>
                        <div>
                          <span className="battle-score-big">{score}</span>
                          <span className="battle-compare-label">score</span>
                        </div>
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
                          <span className="battle-compare-val">{p.rawWpm || p.wpm}</span>
                          <span className="battle-compare-label">raw</span>
                        </div>
                        <div>
                          <span className="battle-compare-val">{p.errors || 0}</span>
                          <span className="battle-compare-label">errors</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Action buttons */}
              <div className="battle-result-actions">
                <button onClick={quickRematch} className="battle-rematch-btn battle-quick-rematch">
                  ⚡ quick rematch
                </button>
                <button onClick={resetBattle} className="battle-rematch-btn">
                  ← back to lobby
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
