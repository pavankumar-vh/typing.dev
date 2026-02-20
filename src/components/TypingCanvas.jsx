import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * TypingCanvas — manually controlled character-by-character typing engine.
 * No textarea or contenteditable. Pure keystroke → state → render loop.
 *
 * Props:
 *  - targetText: string to type
 *  - disabled: stop accepting input (timer expired)
 *  - onMetricsUpdate({ totalTyped, errors, correctChars, startTime }): called on every keystroke
 */
export default function TypingCanvas({ targetText, disabled, onMetricsUpdate }) {
  const [typed, setTyped] = useState([]) // array of { char, correct }
  const startTimeRef = useRef(null)
  const containerRef = useRef(null)

  // Reset when targetText changes
  useEffect(() => {
    setTyped([])
    startTimeRef.current = null
  }, [targetText])

  // Focus container on mount so it captures keys
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  const pushMetrics = useCallback(
    (nextTyped) => {
      const errors = nextTyped.filter((t) => !t.correct).length
      const correctChars = nextTyped.filter((t) => t.correct).length
      onMetricsUpdate?.({
        totalTyped: nextTyped.length,
        errors,
        correctChars,
        startTime: startTimeRef.current,
      })
    },
    [onMetricsUpdate]
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (disabled) return

      // Ignore modifier-only keys and special keys
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        ['Shift', 'CapsLock', 'Tab', 'Escape', 'Control', 'Alt', 'Meta'].includes(e.key)
      ) {
        return
      }

      e.preventDefault()

      // Backspace
      if (e.key === 'Backspace') {
        setTyped((prev) => {
          const next = prev.slice(0, -1)
          pushMetrics(next)
          return next
        })
        return
      }

      // Only process printable single characters + Enter
      let inputChar = e.key
      if (e.key === 'Enter') inputChar = '\n'
      if (inputChar.length !== 1) return

      // Start timer on first real keystroke
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now()
      }

      setTyped((prev) => {
        if (prev.length >= targetText.length) return prev
        const expected = targetText[prev.length]
        const correct = inputChar === expected
        const next = [...prev, { char: inputChar, correct }]
        pushMetrics(next)
        return next
      })
    },
    [disabled, targetText, pushMetrics]
  )

  // Attach global keydown listener
  useEffect(() => {
    const handler = (e) => handleKeyDown(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleKeyDown])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="outline-none leading-relaxed text-base whitespace-pre-wrap"
    >
      {targetText.split('').map((char, i) => {
        const entry = typed[i]
        const isCursor = i === typed.length

        let colorClass = 'text-muted' // pending
        let bgClass = ''

        if (entry) {
          if (entry.correct) {
            colorClass = 'text-text'
          } else {
            colorClass = 'text-error'
            bgClass = 'bg-error/8'
          }
        }

        if (isCursor && !disabled) {
          return (
            <span
              key={i}
              className="bg-accent text-bg animate-pulse"
            >
              {char === '\n' ? '↵\n' : char}
            </span>
          )
        }

        return (
          <span key={i} className={`${colorClass} ${bgClass}`}>
            {char === '\n' ? '↵\n' : char}
          </span>
        )
      })}
    </div>
  )
}
