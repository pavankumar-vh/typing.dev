import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getSnippet } from '../utils/snippetApi.js'
import { calculateWPM as calculateCPM, calculateAccuracy } from '../utils/metrics.js'
import TypingCanvas from '../components/TypingCanvas.jsx'
import MetricsBar from '../components/MetricsBar.jsx'

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
    setCpm(calculateCPM(metrics.totalTyped, elapsed))
    setAccuracy(calculateAccuracy(metrics.correctChars, metrics.totalTyped))
  }, [metrics])

  // Navigate to result when session ends
  useEffect(() => {
    if (sessionDone) {
      navigate('/result', {
        state: {
          cpm,
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
        <button onClick={() => navigate('/setup')} className="border border-divider text-muted px-4 py-2 hover:text-text hover:border-muted transition-all">
          [ BACK TO SETUP ]
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

      <MetricsBar
        cpm={cpm}
        accuracy={accuracy}
        errors={metrics.errors}
        timeRemaining={timeRemaining}
      />

      <div className="text-muted text-xs mb-2 tracking-widest">
        &gt; SNIPPET LOADED — BEGIN TYPING
      </div>
      <div className="bg-panel p-8 border border-divider">
        <TypingCanvas
          targetText={snippet.content}
          disabled={sessionDone}
          onMetricsUpdate={handleMetricsUpdate}
        />
      </div>

      <p className="text-muted text-xs mt-4 blink">
        _ press any key to start timer
      </p>
    </div>
  )
}
