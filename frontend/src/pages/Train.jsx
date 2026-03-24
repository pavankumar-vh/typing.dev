import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getSnippet } from '../utils/snippetApi.js'
import { calculateWPM, calculateAccuracy } from '../utils/metrics.js'

export default function Train() {
  const location = useLocation()
  const navigate = useNavigate()
  const { language, difficulty = 'medium', duration } = location.state || {}

  const [snippet, setSnippet] = useState(null)
  const [snippetLoading, setSnippetLoading] = useState(false)
  const [snippetError, setSnippetError]   = useState(null)
  const [metrics, setMetrics] = useState({
    totalTyped: 0,
    errors: 0,
    correctChars: 0,
    startTime: null,
  })
  const [cpm, setCpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [timeRemaining, setTimeRemaining] = useState(duration || 60)
  const [sessionDone, setSessionDone] = useState(false)

  const timerRef = useRef(null)
  const timerStartedRef = useRef(false)

  useEffect(() => {
    if (!language || !duration) {
      navigate('/')
      return
    }
    setSnippetLoading(true)
    setSnippetError(null)
    getSnippet(language, difficulty)
      .then((s) => setSnippet(s))
      .catch((err) => setSnippetError(err.message))
      .finally(() => setSnippetLoading(false))
  }, [language, difficulty, duration, navigate])

  useEffect(() => {
    if (metrics.startTime && !timerStartedRef.current) {
      timerStartedRef.current = true
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            setSessionDone(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [metrics.startTime])

  useEffect(() => {
    if (!metrics.startTime) return
    const elapsed = Date.now() - metrics.startTime
    setCpm(calculateWPM(metrics.totalTyped, elapsed))
    setAccuracy(calculateAccuracy(metrics.correctChars, metrics.totalTyped))
  }, [metrics])

  useEffect(() => {
    if (sessionDone) {
      navigate('/', {
        state: {
          wpm: cpm,
          accuracy,
          errors: metrics.errors,
          duration,
        },
      })
    }
  }, [sessionDone, cpm, accuracy, metrics.errors, duration, navigate])

  const handleMetricsUpdate = useCallback((data) => {
    setMetrics(data)
  }, [])

  if (snippetLoading) {
    return (
      <motion.div
        className="page-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ justifyContent: 'center' }}
      >
        <div className="train-container" style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, letterSpacing: '0.2em',
            color: 'rgba(0,204,53,0.4)',
            animation: 'auth-blink 1s step-end infinite',
          }}>
            &gt; GENERATING SNIPPET VIA AI &hellip; PLEASE WAIT
          </p>
        </div>
      </motion.div>
    )
  }

  if (snippetError && !snippet) {
    return (
      <motion.div
        className="page-wrap"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ justifyContent: 'center' }}
      >
        <div className="train-container">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: 14, padding: '20px 24px',
              background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)',
              marginBottom: 20,
            }}
          >
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#FF4444', marginBottom: 6 }}>
              &gt; ERROR: {snippetError}
            </p>
          </motion.div>
          <button
            onClick={() => navigate('/')}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, letterSpacing: '0.15em',
              padding: '10px 24px', borderRadius: 8,
              border: '1px solid rgba(0,88,0,0.25)',
              background: 'rgba(0,255,65,0.05)',
              color: 'rgba(0,204,53,0.5)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            [ BACK ]
          </button>
        </div>
      </motion.div>
    )
  }

  if (!snippet) return null

  return (
    <motion.div
      className="page-wrap"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="train-container">

        {/* Page header */}
        <div className="page-header">
          <div className="page-header-prompt">
            <span className="page-header-dot" />
            <span>&gt; training mode</span>
          </div>
          <h1>train</h1>
          <div className="page-header-divider" />
        </div>

        {/* Status bar */}
        <div className="train-status-bar">
          <span>LANG: <span className="value">{language.toUpperCase()}</span></span>
          <span>DIFF: <span className="value">{difficulty.toUpperCase()}</span></span>
          <span>DURATION: <span className="value">{duration}S</span></span>
          <span>STATUS: <span className="value" style={{ color: '#00FF41', textShadow: '0 0 10px rgba(0,255,65,0.6)' }}>ACTIVE</span></span>
        </div>

        {/* Metrics strip */}
        <div className="train-metrics-strip">
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#00FF41', textShadow: '0 0 14px rgba(0,255,65,0.5)', lineHeight: 1 }}>
              {cpm}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(0,204,53,0.32)', letterSpacing: '0.15em', marginTop: 5, textTransform: 'uppercase' }}>
              wpm
            </div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: accuracy >= 95 ? '#00FF41' : 'rgba(0,204,53,0.65)', lineHeight: 1 }}>
              {accuracy}%
            </div>
            <div style={{ fontSize: 9, color: 'rgba(0,204,53,0.32)', letterSpacing: '0.15em', marginTop: 5, textTransform: 'uppercase' }}>
              acc
            </div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: metrics.errors > 0 ? '#FF4444' : 'rgba(0,204,53,0.65)', lineHeight: 1 }}>
              {metrics.errors}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(0,204,53,0.32)', letterSpacing: '0.15em', marginTop: 5, textTransform: 'uppercase' }}>
              errors
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 20, fontWeight: 700, lineHeight: 1,
              color: timeRemaining <= 10 ? '#FF4444' : '#00FF41',
              textShadow: timeRemaining <= 10 ? '0 0 10px rgba(255,68,68,0.5)' : '0 0 8px rgba(0,255,65,0.4)',
            }}>
              {timeRemaining}s
            </div>
            <div style={{ fontSize: 9, color: 'rgba(0,204,53,0.32)', letterSpacing: '0.15em', marginTop: 5, textTransform: 'uppercase' }}>
              time
            </div>
          </div>
        </div>

        {/* Prompt */}
        <p style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10, letterSpacing: '0.18em',
          color: 'rgba(0,204,53,0.3)', marginBottom: 12,
        }}>
          &gt; SNIPPET LOADED &mdash; BEGIN TYPING
        </p>

        {/* Code area */}
        <div className="train-code-area">
          <div className="page-scanline" />
          <pre>{snippet.content}</pre>
        </div>

        {/* Hint */}
        <motion.p
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, letterSpacing: '0.2em',
            color: 'rgba(0,204,53,0.25)',
            marginTop: 16, textAlign: 'center',
          }}
        >
          _ press any key to start timer
        </motion.p>
      </div>
    </motion.div>
  )
}
