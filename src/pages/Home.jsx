import { useState, useEffect, useRef, useCallback } from 'react'
import { getRandomSnippet } from '../data/snippets.js'
import { calculateWPM, calculateAccuracy } from '../utils/metrics.js'

const LANGUAGES = ['java', 'python', 'javascript']
const DURATIONS = [15, 30, 60, 120]

// phase: 'idle' | 'active' | 'result'
export default function Home() {
  const [language, setLanguage] = useState('javascript')
  const [duration, setDuration] = useState(60)
  const [snippet, setSnippet] = useState(null)

  const [phase, setPhase] = useState('idle')
  const [typed, setTyped] = useState([])
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [wpm, setWpm] = useState(0)
  const [rawWpm, setRawWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [errors, setErrors] = useState(0)

  const startTimeRef = useRef(null)
  const timerRef = useRef(null)
  const cursorRef = useRef(null)
  const textBoxRef = useRef(null)

  // ─── Load snippet ────────────────────────────────────────
  const resetState = useCallback((newSnippet, newDuration) => {
    setTyped([])
    setPhase('idle')
    setTimeRemaining(newDuration)
    setWpm(0)
    setRawWpm(0)
    setAccuracy(100)
    setErrors(0)
    startTimeRef.current = null
    if (timerRef.current) clearInterval(timerRef.current)
    if (newSnippet !== undefined) setSnippet(newSnippet)
  }, [])

  const loadNewSnippet = useCallback((lang, dur) => {
    const s = getRandomSnippet(lang)
    resetState(s, dur)
  }, [resetState])

  // Initial load
  useEffect(() => {
    loadNewSnippet(language, duration)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When language or duration pill changes
  const handleLanguageChange = (l) => {
    setLanguage(l)
    loadNewSnippet(l, duration)
  }
  const handleDurationChange = (d) => {
    setDuration(d)
    loadNewSnippet(language, d)
  }

  // ─── Scroll cursor into view ─────────────────────────────
  useEffect(() => {
    if (cursorRef.current && textBoxRef.current) {
      const box = textBoxRef.current
      const cursor = cursorRef.current
      const boxTop = box.getBoundingClientRect().top
      const cursorTop = cursor.getBoundingClientRect().top
      const offset = cursorTop - boxTop
      // keep cursor in the middle third of the visible box
      if (offset > box.clientHeight * 0.66 || offset < box.clientHeight * 0.2) {
        box.scrollTop += offset - box.clientHeight * 0.4
      }
    }
  }, [typed.length])

  // ─── Metrics updater ─────────────────────────────────────
  const updateMetrics = useCallback((typedArr) => {
    if (!startTimeRef.current) return
    const elapsed = Date.now() - startTimeRef.current
    const correct = typedArr.filter((t) => t.correct).length
    const total = typedArr.length
    setWpm(calculateWPM(correct, elapsed))
    setRawWpm(calculateWPM(total, elapsed))
    setAccuracy(calculateAccuracy(correct, total))
    setErrors(typedArr.filter((t) => !t.correct).length)
  }, [])

  // ─── Keyboard handler ────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      // Tab always loads new snippet
      if (e.key === 'Tab') {
        e.preventDefault()
        loadNewSnippet(language, duration)
        return
      }

      if (phase === 'result') return

      // Escape = restart same snippet
      if (e.key === 'Escape') {
        e.preventDefault()
        resetState(undefined, duration)
        return
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (
        [
          'Shift', 'CapsLock', 'Control', 'Alt', 'Meta',
          'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
          'Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown',
          'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
        ].includes(e.key)
      ) return

      e.preventDefault()

      if (e.key === 'Backspace') {
        if (phase === 'idle') return
        setTyped((prev) => {
          const next = prev.slice(0, -1)
          updateMetrics(next)
          return next
        })
        return
      }

      let char = e.key
      if (e.key === 'Enter') char = '\n'
      if (char.length !== 1) return

      // First char starts the timer
      if (phase === 'idle') {
        startTimeRef.current = Date.now()
        setPhase('active')
        timerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current)
              setPhase('result')
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }

      setTyped((prev) => {
        if (!snippet || prev.length >= snippet.content.length) return prev
        const expected = snippet.content[prev.length]
        const correct = char === expected
        const next = [...prev, { char, correct }]
        updateMetrics(next)
        // Snippet fully typed
        if (next.length === snippet.content.length) {
          clearInterval(timerRef.current)
          setPhase('result')
        }
        return next
      })
    },
    [phase, snippet, duration, language, loadNewSnippet, resetState, updateMetrics]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!snippet) return null

  const targetText = snippet.content

  return (
    <div className="min-h-[calc(100vh-53px)] flex flex-col">

      {/* ── Config bar ───────────────────────────────────── */}
      <div className="flex items-center gap-6 justify-center pt-10 pb-6 text-xs text-muted tracking-widest select-none">
        <div className="flex gap-1">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => handleLanguageChange(l)}
              className={`px-3 py-1.5 transition-all ${
                language === l
                  ? 'text-text glow-text'
                  : 'hover:text-text opacity-50 hover:opacity-100'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-divider opacity-60">│</span>
        <div className="flex gap-1">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => handleDurationChange(d)}
              className={`px-3 py-1.5 transition-all ${
                duration === d
                  ? 'text-text glow-text'
                  : 'hover:text-text opacity-50 hover:opacity-100'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      {/* ── Main column ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-8">
        <div className="w-full max-w-3xl">

          {phase !== 'result' ? (
            <>
              {/* Live metrics — invisible until active */}
              <div
                className={`flex items-baseline gap-3 mb-6 transition-opacity duration-500 ${
                  phase === 'active' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <span className="text-4xl glow-text text-text tabular-nums">{wpm}</span>
                <span className="text-muted text-xs">wpm</span>
                <span className="text-muted text-xs mx-2">·</span>
                <span className="text-text text-sm tabular-nums">{accuracy}%</span>
                <span className="text-muted text-xs">acc</span>
                <span className="text-muted text-xs mx-2">·</span>
                <span
                  className={`text-sm tabular-nums ${
                    timeRemaining <= 10 ? 'text-error glow-error' : 'text-text'
                  }`}
                >
                  {timeRemaining}s
                </span>
              </div>

              {/* Typing area — fixed height, cursor stays visible */}
              <div
                ref={textBoxRef}
                className="overflow-hidden relative"
                style={{ height: '9rem' }}
              >
                {/* bottom fade to hint more text */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none z-10"
                  style={{
                    background: 'linear-gradient(to bottom, transparent, #000A00)',
                  }}
                />
                <div className="text-xl leading-9 whitespace-pre-wrap font-mono break-all">
                  {targetText.split('').map((char, i) => {
                    const entry = typed[i]
                    const isCursor = i === typed.length

                    if (isCursor) {
                      return (
                        <span
                          key={i}
                          ref={cursorRef}
                          className="bg-text text-bg blink"
                          style={{ textShadow: 'none' }}
                        >
                          {char === '\n' ? ' ' : char}
                        </span>
                      )
                    }

                    if (!entry) {
                      return (
                        <span key={i} className="text-muted">
                          {char === '\n' ? '↵\n' : char}
                        </span>
                      )
                    }

                    if (entry.correct) {
                      return (
                        <span key={i} className="text-text">
                          {char === '\n' ? '↵\n' : char}
                        </span>
                      )
                    }

                    return (
                      <span
                        key={i}
                        className="text-error glow-error"
                        style={{ backgroundColor: 'rgba(255,49,49,0.12)' }}
                      >
                        {char === '\n' ? '↵\n' : char}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Hints */}
              <div className="flex gap-8 mt-6 text-xs text-muted select-none">
                <span className="opacity-30">tab</span>
                <span className="opacity-20">→ new test</span>
                <span className="opacity-30 ml-4">esc</span>
                <span className="opacity-20">→ restart</span>
              </div>
            </>
          ) : (
            /* ── Result panel ─────────────────────────────── */
            <div>
              <p className="text-muted text-xs tracking-widest mb-12 opacity-60">
                {language} · {duration}s
              </p>
              <div className="grid grid-cols-4 gap-12 mb-14">
                <div>
                  <p className="text-muted text-xs tracking-widest mb-3">wpm</p>
                  <p className="text-6xl glow-text text-text tabular-nums">{wpm}</p>
                </div>
                <div>
                  <p className="text-muted text-xs tracking-widest mb-3">acc</p>
                  <p className="text-6xl glow-text text-text tabular-nums">{accuracy}%</p>
                </div>
                <div>
                  <p className="text-muted text-xs tracking-widest mb-3">raw</p>
                  <p className="text-6xl text-muted tabular-nums">{rawWpm}</p>
                </div>
                <div>
                  <p className="text-muted text-xs tracking-widest mb-3">errors</p>
                  <p
                    className={`text-6xl tabular-nums ${
                      errors > 0 ? 'glow-error text-error' : 'glow-text text-text'
                    }`}
                  >
                    {errors}
                  </p>
                </div>
              </div>
              <div className="flex gap-8 text-xs text-muted select-none">
                <span className="opacity-30">tab</span>
                <span className="opacity-20">→ new test</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
