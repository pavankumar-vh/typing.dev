import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getRandomSnippet } from '../data/snippets.js'
import {
  calculateWPM,
  calculateAccuracy,
  calculateConsistency,
  rollingWPM,
} from '../utils/metrics.js'
import { useConfig, LANGUAGES, DURATIONS } from '../context/ConfigContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const MAX_ERRORS_AHEAD = 8   // monkeytype-style error cap
const LINE_H = 40            // px — must match lineHeight style on text div
const VISIBLE_LINES = 3

// ─── phase: 'idle' | 'active' | 'result' ─────────────────
export default function Home() {
  const { language, setLanguage, duration, setDuration } = useConfig()
  const { user } = useAuth()
  const [snippet, setSnippet]       = useState(null)

  const [phase, setPhase]           = useState('idle')
  const [typed, setTyped]           = useState([])   // [{char, correct, ts}]
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [wpm, setWpm]               = useState(0)
  const [rawWpm, setRawWpm]         = useState(0)
  const [accuracy, setAccuracy]     = useState(100)
  const [errors, setErrors]         = useState(0)
  const [consistency, setConsistency] = useState(100)
  const [capsLock, setCapsLock]     = useState(false)
  const [blocked, setBlocked]       = useState(false)

  const startTimeRef    = useRef(null)
  const timerRef        = useRef(null)
  const wpmSamplesRef   = useRef([])         // WPM snapshot each second
  const typedRef        = useRef([])         // mirrors typed state for callbacks
  const cursorRef       = useRef(null)
  const textInnerRef    = useRef(null)
  const lastScrollLine  = useRef(0)

  // ─── Reset / load ────────────────────────────────────────
  const resetState = useCallback((newSnippet, newDuration) => {
    typedRef.current = []
    wpmSamplesRef.current = []
    lastScrollLine.current = 0
    startTimeRef.current = null
    if (timerRef.current) clearInterval(timerRef.current)
    if (textInnerRef.current) textInnerRef.current.style.transform = 'translateY(0px)'
    setTyped([])
    setPhase('idle')
    setTimeRemaining(newDuration)
    setWpm(0); setRawWpm(0); setAccuracy(100); setErrors(0)
    setConsistency(100); setBlocked(false)
    if (newSnippet !== undefined) setSnippet(newSnippet)
  }, [])

  const loadNewSnippet = useCallback((lang, dur) => {
    resetState(getRandomSnippet(lang), dur)
  }, [resetState])

  useEffect(() => {
    loadNewSnippet(language, duration)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLanguageChange = (l) => { setLanguage(l); loadNewSnippet(l, duration) }
  const handleDurationChange = (d) => { setDuration(d); loadNewSnippet(language, d) }

  // ─── Line-scroll: translate inner div per line ───────────
  useEffect(() => {
    if (!cursorRef.current || !textInnerRef.current) return
    const cursorLine = Math.floor(cursorRef.current.offsetTop / LINE_H)
    const scrollLine = Math.max(0, cursorLine - 1)
    if (scrollLine !== lastScrollLine.current) {
      lastScrollLine.current = scrollLine
      textInnerRef.current.style.transform = `translateY(-${scrollLine * LINE_H}px)`
    }
  }, [typed.length])

  // ─── Live metrics (called on every keystroke) ─────────────
  const updateMetrics = useCallback((arr) => {
    if (!startTimeRef.current) return
    const correct = arr.filter((t) => t.correct).length
    const total   = arr.length
    setWpm(rollingWPM(arr))
    setRawWpm(calculateWPM(total, Date.now() - startTimeRef.current))
    setAccuracy(calculateAccuracy(correct, total))
    setErrors(arr.filter((t) => !t.correct).length)
  }, [])

  // ─── Finalize: lock in final metrics + save ───────────────
  const finalize = useCallback((arr) => {
    if (!startTimeRef.current) return
    const elapsed   = Date.now() - startTimeRef.current
    const correct   = arr.filter((t) => t.correct).length
    const total     = arr.length
    const finalWpm  = calculateWPM(correct, elapsed)
    const finalRaw  = calculateWPM(total, elapsed)
    const finalAcc  = calculateAccuracy(correct, total)
    const finalErr  = arr.filter((t) => !t.correct).length
    const cons      = calculateConsistency(wpmSamplesRef.current)

    setWpm(finalWpm); setRawWpm(finalRaw)
    setAccuracy(finalAcc); setErrors(finalErr)
    setConsistency(cons)
    setPhase('result')

    fetch(`${API_BASE}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language, duration,
        wpm: finalWpm, rawWpm: finalRaw,
        accuracy: finalAcc, errors: finalErr,
        snippetId: snippet?.id,
        userId:      user?.uid   || null,
        displayName: user?.displayName || 'anonymous',
      }),
    }).catch((e) => console.warn('[api] session not saved:', e.message))
  }, [language, duration, snippet])

  // ─── Time-up trigger ─────────────────────────────────────
  useEffect(() => {
    if (timeRemaining === 0 && phase === 'active') {
      clearInterval(timerRef.current)
      finalize(typedRef.current)
    }
  }, [timeRemaining, phase, finalize])

  // ─── Keyboard handler ────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    setCapsLock(e.getModifierState('CapsLock'))

    if (e.key === 'Tab') { e.preventDefault(); loadNewSnippet(language, duration); return }
    if (phase === 'result') return
    if (e.key === 'Escape') { e.preventDefault(); resetState(undefined, duration); return }

    // Ctrl+Backspace → delete word
    if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
      e.preventDefault()
      if (phase === 'idle') return
      setTyped((prev) => {
        let i = prev.length - 1
        while (i >= 0 && prev[i].char === ' ') i--
        while (i >= 0 && prev[i].char !== ' ' && prev[i].char !== '\n') i--
        const next = prev.slice(0, i + 1)
        typedRef.current = next
        updateMetrics(next)
        setBlocked(false)
        return next
      })
      return
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return

    if (['Shift','CapsLock','Control','Alt','Meta',
         'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
         'Insert','Home','End','PageUp','PageDown',
         'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
    ].includes(e.key)) return

    e.preventDefault()

    if (e.key === 'Backspace') {
      if (phase === 'idle') return
      setTyped((prev) => {
        const next = prev.slice(0, -1)
        typedRef.current = next
        updateMetrics(next)
        // re-evaluate block after backspace
        let trailing = 0
        for (let i = next.length - 1; i >= 0; i--) {
          if (!next[i].correct) trailing++; else break
        }
        setBlocked(trailing >= MAX_ERRORS_AHEAD)
        return next
      })
      return
    }

    if (blocked) return

    let char = e.key
    if (e.key === 'Enter') char = '\n'
    if (char.length !== 1) return

    // First keystroke starts timer
    if (phase === 'idle') {
      startTimeRef.current = Date.now()
      setPhase('active')
      timerRef.current = setInterval(() => {
        // Sample WPM every second for consistency
        wpmSamplesRef.current.push(rollingWPM(typedRef.current))
        setTimeRemaining((prev) => (prev <= 1 ? 0 : prev - 1))
      }, 1000)
    }

    setTyped((prev) => {
      if (!snippet || prev.length >= snippet.content.length) return prev
      const expected = snippet.content[prev.length]
      const next = [...prev, { char, correct: char === expected, ts: Date.now() }]
      typedRef.current = next
      updateMetrics(next)

      // Error cap
      let trailing = 0
      for (let i = next.length - 1; i >= 0; i--) {
        if (!next[i].correct) trailing++; else break
      }
      setBlocked(trailing >= MAX_ERRORS_AHEAD)

      // Snippet fully typed
      if (next.length === snippet.content.length) {
        clearInterval(timerRef.current)
        setTimeout(() => finalize(next), 0)
      }
      return next
    })
  }, [phase, snippet, duration, language, blocked, loadNewSnippet, resetState, updateMetrics, finalize])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!snippet) return null

  const targetText = snippet.content
  const progress   = Math.round((typed.length / targetText.length) * 100)
  const correctTyped = typed.filter((t) => t.correct).length

  return (
    <div className="min-h-[calc(100vh-53px)] flex flex-col">

      {/* ── Config bar ───────────────────────────────────── */}
      <div className={`flex items-center gap-6 justify-center pt-8 pb-4 text-sm text-muted tracking-widest select-none transition-opacity duration-300 ${
        phase === 'active' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <div className="flex gap-1">
          {LANGUAGES.map((l) => (
            <button key={l} onClick={() => handleLanguageChange(l)}
              className={`px-3 py-1.5 transition-all ${
                language === l ? 'text-text glow-text' : 'hover:text-text opacity-50 hover:opacity-100'
              }`}
            >{l}</button>
          ))}
        </div>
        <span className="text-divider opacity-60">│</span>
        <div className="flex gap-1">
          {DURATIONS.map((d) => (
            <button key={d} onClick={() => handleDurationChange(d)}
              className={`px-3 py-1.5 transition-all ${
                duration === d ? 'text-text glow-text' : 'hover:text-text opacity-50 hover:opacity-100'
              }`}
            >{d}s</button>
          ))}
        </div>
      </div>

      {/* ── Main column ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-4">
        <div className="w-full max-w-3xl">

          {phase !== 'result' ? (
            <>
              {/* Live metrics */}
              <div className={`flex items-baseline gap-3 mb-5 transition-opacity duration-500 ${
                phase === 'active' ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}>
                <span className="text-5xl glow-text text-text tabular-nums">{wpm}</span>
                <span className="text-muted text-sm">wpm</span>
                <span className="text-muted text-sm mx-2">·</span>
                <span className="text-text text-base tabular-nums">{accuracy}%</span>
                <span className="text-muted text-sm">acc</span>
                <span className="text-muted text-sm mx-2">·</span>
                <span className={`text-base tabular-nums ${timeRemaining <= 10 ? 'text-error glow-error' : 'text-text'}`}>
                  {timeRemaining}s
                </span>
                {errors > 0 && (
                  <>
                    <span className="text-muted text-sm mx-2">·</span>
                    <span className="text-error tabular-nums text-sm">{errors} err</span>
                  </>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full mb-4 rounded-full overflow-hidden" style={{ height: '2px', background: 'rgba(0,255,65,0.08)' }}>
                <div
                  className="h-full transition-all duration-150"
                  style={{ width: `${progress}%`, background: 'rgba(0,255,65,0.55)', boxShadow: '0 0 8px rgba(0,255,65,0.4)' }}
                />
              </div>

              {/* CapsLock warning */}
              {capsLock && (
                <p className="text-error text-xs tracking-widest mb-2 glow-error animate-pulse select-none">
                  ⚠ CAPS LOCK ON
                </p>
              )}

              {/* Typing area — 3 visible lines, smooth line-scroll */}
              <div
                className="overflow-hidden relative rounded"
                style={{ height: `${LINE_H * VISIBLE_LINES}px` }}
              >
                {/* Top fade */}
                <div className="absolute top-0 left-0 right-0 pointer-events-none z-10"
                  style={{ height: LINE_H, background: 'linear-gradient(to bottom, #000A00 0%, transparent 100%)' }} />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
                  style={{ height: LINE_H, background: 'linear-gradient(to top, #000A00 0%, transparent 100%)' }} />

                <div
                  ref={textInnerRef}
                  className="whitespace-pre-wrap font-mono"
                  style={{ fontSize: '1.2rem', lineHeight: `${LINE_H}px`, transition: 'transform 0.12s ease' }}
                >
                  {targetText.split('').map((char, i) => {
                    const entry    = typed[i]
                    const isCursor = i === typed.length

                    if (isCursor) {
                      return (
                        <span key={i} ref={cursorRef}
                          className={`blink ${blocked ? 'text-error' : 'bg-text text-bg'}`}
                          style={{ textShadow: 'none', ...(blocked ? { borderBottom: '2px solid #FF4444', backgroundColor: 'rgba(255,68,68,0.12)' } : {}) }}
                        >
                          {char === '\n' ? ' ' : char}
                        </span>
                      )
                    }

                    if (!entry) return (
                      <span key={i} className="text-muted opacity-60">{char === '\n' ? '↵\n' : char}</span>
                    )
                    if (entry.correct) return (
                      <span key={i} className="text-text">{char === '\n' ? '↵\n' : char}</span>
                    )
                    return (
                      <span key={i} className="text-error glow-error"
                        style={{ backgroundColor: 'rgba(255,68,68,0.14)' }}
                      >
                        {char === '\n' ? '↵\n' : char}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Hints / blocked warning */}
              <div className="flex items-center gap-5 mt-5 text-xs text-muted select-none">
                {blocked ? (
                  <span className="text-error glow-error tracking-widest animate-pulse">
                    too many errors — backspace to continue
                  </span>
                ) : (
                  <>
                    <span className="opacity-40">tab → new</span>
                    <span className="opacity-25">·</span>
                    <span className="opacity-40">esc → restart</span>
                    <span className="opacity-25">·</span>
                    <span className="opacity-40">ctrl+⌫ → delete word</span>
                  </>
                )}
              </div>
            </>
          ) : (
            /* ── Result panel ─────────────────────────────── */
            <div>
              <p className="text-muted text-sm tracking-widest mb-12 opacity-80">
                {language} · {duration}s
              </p>

              {/* Primary stats */}
              <div className="grid grid-cols-4 gap-10 mb-10">
                <div>
                  <p className="text-muted text-sm tracking-widest mb-3">wpm</p>
                  <p className="text-7xl glow-text text-text tabular-nums">{wpm}</p>
                </div>
                <div>
                  <p className="text-muted text-sm tracking-widest mb-3">acc</p>
                  <p className="text-7xl glow-text text-text tabular-nums">{accuracy}%</p>
                </div>
                <div>
                  <p className="text-muted text-sm tracking-widest mb-3">raw</p>
                  <p className="text-6xl text-muted tabular-nums">{rawWpm}</p>
                </div>
                <div>
                  <p className="text-muted text-sm tracking-widest mb-3">errors</p>
                  <p className={`text-7xl tabular-nums ${errors > 0 ? 'glow-error text-error' : 'glow-text text-text'}`}>
                    {errors}
                  </p>
                </div>
              </div>

              {/* Secondary stats */}
              <div
                className="flex gap-12 mb-12 pt-8 border-t"
                style={{ borderColor: 'rgba(0,85,0,0.4)' }}
              >
                <div>
                  <p className="text-muted text-xs tracking-widest mb-2">consistency</p>
                  <p className={`text-3xl tabular-nums ${
                    consistency >= 80 ? 'text-text glow-text'
                    : consistency >= 60 ? 'text-muted'
                    : 'text-error'
                  }`}>{consistency}%</p>
                </div>
                <div>
                  <p className="text-muted text-xs tracking-widest mb-2">chars</p>
                  <p className="text-3xl text-muted tabular-nums">
                    {correctTyped}
                    <span className="text-xl opacity-40">/{typed.length}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-8 text-sm text-muted select-none">
                <span className="opacity-30">tab</span>
                <span className="opacity-20">→ new test</span>
                <span className="opacity-20 mx-4">·</span>
                <Link to="/leaderboard" className="opacity-40 hover:opacity-100 hover:text-text transition-all">
                  leaderboard →
                </Link>
                <Link to="/history" className="opacity-40 hover:opacity-100 hover:text-text transition-all">
                  history →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
