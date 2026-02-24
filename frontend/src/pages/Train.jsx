import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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

  // Redirect if no config; otherwise fetch snippet via API (with local fallback)
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

  // Start countdown when first key is pressed
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

  // Update live CPM / accuracy
  useEffect(() => {
    if (!metrics.startTime) return
    const elapsed = Date.now() - metrics.startTime
    setCpm(calculateWPM(metrics.totalTyped, elapsed))
    setAccuracy(calculateAccuracy(metrics.correctChars, metrics.totalTyped))
  }, [metrics])

  // Navigate to result when session ends
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
      <div className="max-w-3xl mx-auto mt-8 text-muted text-xs tracking-widest">
        <p className="blink">&gt; GENERATING SNIPPET VIA AI … PLEASE WAIT</p>
      </div>
    )
  }

  if (snippetError && !snippet) {
    return (
      <div className="max-w-3xl mx-auto mt-8 text-xs tracking-widest">
        <p className="text-error mb-4">&gt; ERROR: {snippetError}</p>
        <button onClick={() => navigate('/')} className="border border-divider text-muted px-4 py-2 hover:text-text hover:border-muted transition-all">
          [ BACK ]
        </button>
      </div>
    )
  }

  if (!snippet) return null

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <p className="text-muted text-xs tracking-widest mb-4">
        LANG:<span className="text-text">{language.toUpperCase()}</span>
        {'  '}DIFF:<span className="text-text">{difficulty.toUpperCase()}</span>
        {'  '}DURATION:<span className="text-text">{duration}S</span>
        {'  '}STATUS:<span className="text-success glow-text">ACTIVE</span>
      </p>

      {/* Metrics strip */}
      <div className="flex gap-8 text-xs tracking-widest mb-4 text-muted">
        <span>WPM: <span className="text-text glow-text">{cpm}</span></span>
        <span>ACC: <span className="text-text">{accuracy}%</span></span>
        <span>ERR: <span className="text-text">{metrics.errors}</span></span>
        <span>TIME: <span className="text-text">{timeRemaining}s</span></span>
      </div>

      <div className="text-muted text-xs mb-2 tracking-widest">
        &gt; SNIPPET LOADED — BEGIN TYPING
      </div>
      <div className="bg-panel p-8 border border-divider">
        <pre className="text-text whitespace-pre-wrap font-mono text-sm leading-relaxed select-none">
          {snippet.content}
        </pre>
      </div>

      <p className="text-muted text-xs mt-4 blink">
        _ press any key to start timer
      </p>
    </div>
  )
}
