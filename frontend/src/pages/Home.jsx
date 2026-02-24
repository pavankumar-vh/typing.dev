import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getSnippet } from '../utils/snippetApi.js'
import {
  calculateWPM,
  calculateAccuracy,
  calculateConsistency,
  rollingWPM,
} from '../utils/metrics.js'
import { useConfig, LANGUAGES, DURATIONS, DIFFICULTIES, CODE_FOCUS, SNIPPET_SIZES, LANG_API_MAP, LANG_BADGE } from '../context/ConfigContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
const API_BASE = ''
const MAX_ERRORS_AHEAD = 8   // monkeytype-style error cap
const LINE_H = 40            // px — must match lineHeight style on text div
const VISIBLE_LINES = 3

// ─── phase: 'idle' | 'active' | 'result' ─────────────────
export default function Home() {
  const { language, setLanguage, duration, setDuration, difficulty, setDifficulty, codeFocus, setCodeFocus, snippetSize, setSnippetSize, punctuation, setPunctuation } = useConfig()
  const { user } = useAuth()
  const [snippet, setSnippet]         = useState(null)
  const [snippetLoading, setSnippetLoading] = useState(false)
  const [showCustom, setShowCustom]   = useState(false)
  const customPanelRef                = useRef(null)

  const [phase, setPhase]           = useState('idle')
  const [typed, setTyped]           = useState([])   // [{char, correct, ts}]
  const [timeRemaining, setTimeRemaining] = useState(duration)
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
  const cursorRef       = useRef(null)       // char at cursor position (for line-scroll + caret)
  const caretRef        = useRef(null)       // absolutely-positioned smooth caret overlay
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

  const loadNewSnippet = useCallback(async (lang, dur, diff, focus, size) => {
    resetState(undefined, dur)
    setSnippetLoading(true)
    try {
      const s = await getSnippet(LANG_API_MAP[lang] || lang, diff || 'medium', focus, size)
      setSnippet(s)
    } finally {
      setSnippetLoading(false)
    }
  }, [resetState])

  useEffect(() => {
    loadNewSnippet(language, duration, difficulty, codeFocus, snippetSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close custom panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (customPanelRef.current && !customPanelRef.current.contains(e.target)) {
        setShowCustom(false)
      }
    }
    if (showCustom) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCustom])

  const handleLanguageChange   = (l)    => { setLanguage(l);    loadNewSnippet(l, duration, difficulty, codeFocus, snippetSize); setShowCustom(false) }
  const handleDurationChange   = (d)    => { setDuration(d);    loadNewSnippet(language, d, difficulty, codeFocus, snippetSize); setShowCustom(false) }
  const handleDifficultyChange = (diff) => { setDifficulty(diff); loadNewSnippet(language, duration, diff, codeFocus, snippetSize) }
  const handleFocusChange      = (f)    => { setCodeFocus(f);   loadNewSnippet(language, duration, difficulty, f, snippetSize) }
  const handleSizeChange       = (sz)   => { setSnippetSize(sz); loadNewSnippet(language, duration, difficulty, codeFocus, sz) }
  const handlePunctuationToggle = ()    => setPunctuation((v) => !v)

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

  // ─── Smooth caret: move overlay to current char position ──
  useEffect(() => {
    if (!cursorRef.current || !caretRef.current) return
    const el = cursorRef.current
    caretRef.current.style.left   = el.offsetLeft + 'px'
    caretRef.current.style.top    = el.offsetTop + 'px'
    caretRef.current.style.width  = el.offsetWidth + 'px'
    caretRef.current.style.height = el.offsetHeight + 'px'
  }, [typed.length, snippet])

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
        userId:      user?.uid         || null,
        displayName: user?.displayName || user?.email?.split('@')[0] || 'anonymous',
      }),
    }).catch((e) => console.warn('[api] session not saved:', e.message))
  }, [language, duration, snippet, user])

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

  if (snippetLoading || !snippet) return (
    <motion.div
      className="min-h-[calc(100vh-53px)] flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <p className="text-muted text-xs tracking-widest blink">&gt; LOADING SNIPPET…</p>
    </motion.div>
  )

  const targetText = snippet.content
  const progress   = Math.round((typed.length / targetText.length) * 100)
  const correctTyped = typed.filter((t) => t.correct).length

  return (
    <motion.div
      className="min-h-[calc(100vh-53px)] flex flex-col"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >

      {/* ── Main column ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
        <div className="w-full max-w-3xl">

          {phase !== 'result' ? (
            <>
              {/* ── Config bar ── centered pill, auto-width */}
              <div ref={customPanelRef} className="mb-10 w-full select-none relative flex flex-col items-center">

                {/* Main pill — shrinks to content, centered */}
                <div
                  className="inline-flex flex-wrap items-center rounded-full px-3 py-1.5"
                  style={{
                    background: 'rgba(0,10,0,0.92)',
                    border: '1px solid rgba(0,100,0,0.28)',
                    boxShadow: '0 2px 24px rgba(0,0,0,0.55)',
                    gap: 0,
                  }}
                >
                  {/* Clock icon */}
                  <span className="flex items-center" style={{ color: 'rgba(0,204,53,0.3)', paddingLeft: '10px', paddingRight: '10px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </span>

                  {/* Duration buttons */}
                  {DURATIONS.map((d) => {
                    const active = duration === d
                    return (
                      <button
                        key={d}
                        onClick={() => handleDurationChange(d)}
                        className="relative rounded-full transition-all duration-150 font-mono tabular-nums"
                        style={{
                          fontSize: '13px',
                          padding: '6px 16px',
                          color:      active ? '#00FF41' : 'rgba(0,204,53,0.4)',
                          background: active ? 'rgba(0,255,65,0.1)' : 'transparent',
                          textShadow: active ? '0 0 12px rgba(0,255,65,0.75)' : 'none',
                          boxShadow:  active ? 'inset 0 0 0 1px rgba(0,255,65,0.18)' : 'none',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {d}s
                      </button>
                    )
                  })}

                  {/* Separator */}
                  <div
                    className="mx-1 flex-shrink-0"
                    style={{ width: '1px', height: '16px', background: 'rgba(0,130,0,0.35)' }}
                  />

                  {/* Custom trigger — { badge lang ▾ } */}
                  <button
                    onClick={() => setShowCustom((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-full transition-all duration-200 font-mono"
                    style={{
                      padding: '6px 14px 6px 10px',
                      color:      showCustom ? '#00FF41' : 'rgba(0,204,53,0.55)',
                      background: showCustom ? 'rgba(0,255,65,0.1)' : 'transparent',
                      textShadow: showCustom ? '0 0 10px rgba(0,255,65,0.6)' : 'none',
                      boxShadow:  showCustom ? 'inset 0 0 0 1px rgba(0,255,65,0.2)' : 'none',
                    }}
                  >
                    {/* Badge chip */}
                    <span
                      className="font-mono font-bold"
                      style={{
                        fontSize: '9px',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        background: showCustom ? 'rgba(0,255,65,0.18)' : 'rgba(0,100,0,0.4)',
                        color: showCustom ? '#00FF41' : 'rgba(0,204,53,0.6)',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {LANG_BADGE[language] ?? language.slice(0, 2).toUpperCase()}
                    </span>

                    {/* Language name */}
                    <span style={{ fontSize: '12px', letterSpacing: '0.03em' }}>
                      {language}
                    </span>

                    {/* Chevron */}
                    <svg
                      width="8" height="8" viewBox="0 0 10 6" fill="none"
                      style={{
                        opacity: 0.45,
                        transform: showCustom ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                      }}
                    >
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* ── Custom panel (dropdown) ── */}
                <AnimatePresence>
                {showCustom && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute top-full left-0 right-0 mt-3 rounded-2xl z-30"
                    style={{
                      background: 'rgba(0,6,0,0.98)',
                      border: '1px solid rgba(0,130,0,0.22)',
                      boxShadow: '0 16px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,255,65,0.03)',
                    }}
                  >
                    {/* ── Panel header ── */}
                    <div
                      className="flex items-center justify-between px-6 py-3"
                      style={{ borderBottom: '1px solid rgba(0,100,0,0.12)' }}
                    >
                      <span className="font-mono" style={{ fontSize: '11px', color: 'rgba(0,204,53,0.4)', letterSpacing: '0.16em' }}>
                        CUSTOMIZE
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Active config summary chips */}
                        {[LANG_BADGE[language], difficulty, codeFocus, snippetSize].map((chip, i) => (
                          <span key={i} className="font-mono" style={{
                            fontSize: '10px', padding: '3px 8px', borderRadius: '5px',
                            background: 'rgba(0,255,65,0.07)', color: 'rgba(0,204,53,0.55)',
                            border: '1px solid rgba(0,100,0,0.22)', letterSpacing: '0.06em',
                          }}>{chip}</span>
                        ))}
                      </div>
                    </div>

                    <div className="px-6 py-5">

                      {/* ── LANGUAGE ── */}
                      <p className="font-mono mb-3" style={{ fontSize: '13px', color: 'rgba(0,204,53,0.5)', letterSpacing: '0.12em' }}>language</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {LANGUAGES.map((l) => {
                          const active = language === l
                          return (
                            <button
                              key={l}
                              onClick={() => handleLanguageChange(l)}
                              className="inline-flex items-center gap-1.5 rounded-lg transition-all duration-150 font-mono"
                              style={{
                                fontSize: '13px',
                                padding: '5px 12px 5px 8px',
                                color:      active ? '#00FF41' : 'rgba(0,204,53,0.5)',
                                background: active ? 'rgba(0,255,65,0.09)' : 'rgba(0,255,65,0.02)',
                                border:     active ? '1px solid rgba(0,255,65,0.22)' : '1px solid rgba(0,100,0,0.18)',
                                textShadow: active ? '0 0 8px rgba(0,255,65,0.5)' : 'none',
                              }}
                            >
                              <span className="font-bold" style={{
                                fontSize: '9px', padding: '2px 4px', borderRadius: '3px',
                                background: active ? 'rgba(0,255,65,0.18)' : 'rgba(0,100,0,0.3)',
                                color: active ? '#00FF41' : 'rgba(0,204,53,0.45)',
                                letterSpacing: '0.05em',
                              }}>
                                {LANG_BADGE[l] ?? l.slice(0, 2).toUpperCase()}
                              </span>
                              {l}
                            </button>
                          )
                        })}
                      </div>

                      {/* ── Row: DIFFICULTY + CODE FOCUS ── */}
                      <div className="grid grid-cols-2 gap-5 mb-5">

                        {/* DIFFICULTY */}
                        <div>
                          <p className="font-mono mb-2.5" style={{ fontSize: '13px', color: 'rgba(0,204,53,0.5)', letterSpacing: '0.12em' }}>difficulty</p>
                          <div className="flex gap-1.5">
                            {DIFFICULTIES.map((diff) => {
                              const active = difficulty === diff
                              const col = { easy: '#4ADE80', medium: '#00FF41', hard: '#FB923C' }[diff]
                              return (
                                <button
                                  key={diff}
                                  onClick={() => handleDifficultyChange(diff)}
                                  className="rounded-lg transition-all duration-150 font-mono capitalize flex-1"
                                  style={{
                                    fontSize: '12px', padding: '6px 0',
                                    color:      active ? col : 'rgba(0,204,53,0.4)',
                                    background: active ? `${col}12` : 'rgba(0,255,65,0.02)',
                                    border:     active ? `1px solid ${col}35` : '1px solid rgba(0,100,0,0.18)',
                                    textShadow: active ? `0 0 8px ${col}65` : 'none',
                                  }}
                                >
                                  {diff}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* CODE FOCUS */}
                        <div>
                          <p className="font-mono mb-2.5" style={{ fontSize: '13px', color: 'rgba(0,204,53,0.5)', letterSpacing: '0.12em' }}>code focus</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {CODE_FOCUS.map((f) => {
                              const active = codeFocus === f
                              return (
                                <button
                                  key={f}
                                  onClick={() => handleFocusChange(f)}
                                  className="rounded-lg transition-all duration-150 font-mono capitalize"
                                  style={{
                                    fontSize: '12px', padding: '6px 10px',
                                    color:      active ? '#00FF41' : 'rgba(0,204,53,0.4)',
                                    background: active ? 'rgba(0,255,65,0.09)' : 'rgba(0,255,65,0.02)',
                                    border:     active ? '1px solid rgba(0,255,65,0.22)' : '1px solid rgba(0,100,0,0.18)',
                                    textShadow: active ? '0 0 8px rgba(0,255,65,0.5)' : 'none',
                                  }}
                                >
                                  {f}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                      </div>

                      {/* ── Row: SNIPPET SIZE + OPTIONS ── */}
                      <div className="grid grid-cols-2 gap-5">

                        {/* SNIPPET SIZE */}
                        <div>
                          <p className="font-mono mb-2.5" style={{ fontSize: '13px', color: 'rgba(0,204,53,0.5)', letterSpacing: '0.12em' }}>snippet size</p>
                          <div className="flex gap-1.5">
                            {SNIPPET_SIZES.map((sz) => {
                              const active = snippetSize === sz
                              return (
                                <button
                                  key={sz}
                                  onClick={() => handleSizeChange(sz)}
                                  className="rounded-lg transition-all duration-150 font-mono capitalize flex-1"
                                  style={{
                                    fontSize: '12px', padding: '6px 0',
                                    color:      active ? '#00FF41' : 'rgba(0,204,53,0.4)',
                                    background: active ? 'rgba(0,255,65,0.09)' : 'rgba(0,255,65,0.02)',
                                    border:     active ? '1px solid rgba(0,255,65,0.22)' : '1px solid rgba(0,100,0,0.18)',
                                    textShadow: active ? '0 0 8px rgba(0,255,65,0.5)' : 'none',
                                  }}
                                >
                                  {sz}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* OPTIONS */}
                        <div>
                          <p className="font-mono mb-2.5" style={{ fontSize: '13px', color: 'rgba(0,204,53,0.5)', letterSpacing: '0.12em' }}>options</p>
                          <div className="flex gap-1.5">
                            <button
                              onClick={handlePunctuationToggle}
                              className="inline-flex items-center gap-1.5 rounded-lg transition-all duration-150 font-mono"
                              style={{
                                fontSize: '12px', padding: '6px 12px',
                                color:      punctuation ? '#00FF41' : 'rgba(0,204,53,0.38)',
                                background: punctuation ? 'rgba(0,255,65,0.09)' : 'rgba(0,255,65,0.02)',
                                border:     punctuation ? '1px solid rgba(0,255,65,0.22)' : '1px solid rgba(0,100,0,0.18)',
                                textShadow: punctuation ? '0 0 8px rgba(0,255,65,0.5)' : 'none',
                              }}
                            >
                              <span style={{ fontSize: '12px', lineHeight: 1, opacity: 0.7 }}>@</span>
                              punctuation
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* ── Regenerate button ── */}
                      <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(0,100,0,0.12)' }}>
                        <button
                          onClick={() => { loadNewSnippet(language, duration, difficulty, codeFocus, snippetSize); setShowCustom(false) }}
                          className="w-full rounded-lg font-mono transition-all duration-150 flex items-center justify-center gap-2"
                          style={{
                            fontSize: '12px', padding: '8px 0',
                            color: 'rgba(0,204,53,0.5)',
                            background: 'rgba(0,255,65,0.03)',
                            border: '1px solid rgba(0,100,0,0.18)',
                            letterSpacing: '0.1em',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color='#00FF41'; e.currentTarget.style.background='rgba(0,255,65,0.08)'; e.currentTarget.style.borderColor='rgba(0,255,65,0.2)' }}
                          onMouseLeave={e => { e.currentTarget.style.color='rgba(0,204,53,0.5)'; e.currentTarget.style.background='rgba(0,255,65,0.03)'; e.currentTarget.style.borderColor='rgba(0,100,0,0.18)' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                          </svg>
                          regenerate snippet
                        </button>
                      </div>

                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
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
                <span className={`tabular-nums relative overflow-hidden inline-flex items-center ${timeRemaining <= 10 ? 'text-error glow-error' : 'text-text'}`} style={{ fontSize: '1rem', minWidth: '3.5ch' }}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={timeRemaining}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="inline-block tabular-nums"
                    >
                      {timeRemaining}s
                    </motion.span>
                  </AnimatePresence>
                </span>
                {errors > 0 && (
                  <>
                    <span className="text-muted text-sm mx-2">·</span>
                    <span className="text-error tabular-nums text-sm">{errors} err</span>
                  </>
                )}
              </div>

              {/* Progress bar */}
              <motion.div
                className="w-full mb-4 rounded-full overflow-hidden"
                style={{ height: '2px', background: 'rgba(0,255,65,0.08)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20, mass: 0.5 }}
                  style={{ background: 'rgba(0,255,65,0.55)', boxShadow: '0 0 8px rgba(0,255,65,0.4)' }}
                />
              </motion.div>

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
                {/* Bottom fade only — top fade was hiding the first line */}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
                  style={{ height: LINE_H, background: 'linear-gradient(to top, #000A00 0%, transparent 100%)' }} />

                <div
                  ref={textInnerRef}
                  className="whitespace-pre-wrap font-mono relative"
                  style={{ fontSize: '1.2rem', lineHeight: `${LINE_H}px`, transition: 'transform 0.18s cubic-bezier(0.22,1,0.36,1)' }}
                >
                  {/* Smooth caret overlay */}
                  <div
                    ref={caretRef}
                    style={{
                      position: 'absolute',
                      pointerEvents: 'none',
                      zIndex: 2,
                      borderRadius: '2px',
                      background: blocked ? 'rgba(255,68,68,0.7)' : '#00FF41',
                      boxShadow: blocked
                        ? '0 0 8px rgba(255,68,68,0.7)'
                        : '0 0 14px rgba(0,255,65,0.9), 0 0 4px rgba(0,255,65,0.5)',
                      transition: 'left 0.07s cubic-bezier(0.22,1,0.36,1), top 0.12s cubic-bezier(0.22,1,0.36,1), background 0.12s, box-shadow 0.12s',
                      animation: 'cursorPulse 1s ease-in-out infinite',
                    }}
                  />

                  {targetText.split('').map((char, i) => {
                    const entry    = typed[i]
                    const isCursor = i === typed.length

                    if (isCursor) {
                      return (
                        <span
                          key="cursor-anchor"
                          ref={cursorRef}
                          style={{
                            display: 'inline-block',
                            position: 'relative',
                            zIndex: 3,
                            color: blocked ? '#FF8888' : '#000A00',
                          }}
                        >
                          {char === '\n' ? ' ' : char}
                        </span>
                      )
                    }

                    if (!entry) return (
                      <span key={i} style={{ color: '#00CC35', opacity: 0.45 }}>{char === '\n' ? '↵\n' : char}</span>
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
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
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
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
