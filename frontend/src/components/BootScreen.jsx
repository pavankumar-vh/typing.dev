import { useEffect, useRef, useState, useCallback } from 'react'

const BOOT_LINES = [
  { text: '> INITIALIZING KERNEL................', suffix: ' [OK]', delay: 0 },
  { text: '> LOADING SNIPPET ENGINE.............', suffix: ' [OK]', delay: 320 },
  { text: '> MOUNTING METRICS MODULE............', suffix: ' [OK]', delay: 620 },
  { text: '> CALIBRATING KEYSTROKE PARSER.......', suffix: ' [OK]', delay: 950 },
  { text: '> ESTABLISHING PHOSPHOR DISPLAY......', suffix: ' [OK]', delay: 1220 },
  { text: '> SCANNING LANGUAGE PACKS............', suffix: ' [OK]', delay: 1500 },
  { text: '> ALIGNING CHARACTER BUFFER..........', suffix: ' [OK]', delay: 1750 },
  { text: '> ALL SYSTEMS NOMINAL................', suffix: ' [OK]', delay: 2050 },
]

const MATRIX_CHARS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default function BootScreen({ onComplete }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const columnsRef = useRef([])
  const [visibleLines, setVisibleLines] = useState([])
  const [showReady, setShowReady] = useState(false)
  const [exiting, setExiting] = useState(false)
  const completedRef = useRef(false)

  // ── Matrix rain ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const fontSize = 14
    let width, height, cols

    const resize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      cols = Math.floor(width / fontSize)
      columnsRef.current = Array.from({ length: cols }, () =>
        Math.random() * (height / fontSize) * -1
      )
    }
    resize()
    window.addEventListener('resize', resize)

    let lastTime = 0
    const fps = 20
    const interval = 1000 / fps

    const draw = (timestamp) => {
      if (timestamp - lastTime < interval) {
        animFrameRef.current = requestAnimationFrame(draw)
        return
      }
      lastTime = timestamp

      // Fade trail
      ctx.fillStyle = 'rgba(0, 10, 0, 0.05)'
      ctx.fillRect(0, 0, width, height)

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`

      columnsRef.current.forEach((y, i) => {
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
        const x = i * fontSize

        // Lead character — bright white-green
        if (Math.random() > 0.95) {
          ctx.fillStyle = '#CCFFCC'
          ctx.shadowBlur = 8
          ctx.shadowColor = '#00FF41'
        } else {
          // Trail — phosphor green with varying opacity
          const opacity = Math.random() * 0.6 + 0.2
          ctx.fillStyle = `rgba(0, ${Math.floor(180 + Math.random() * 75)}, ${Math.floor(Math.random() * 40)}, ${opacity})`
          ctx.shadowBlur = 4
          ctx.shadowColor = '#00FF41'
        }

        ctx.fillText(char, x, y * fontSize)
        ctx.shadowBlur = 0

        // Reset column when it goes off screen
        if (y * fontSize > height && Math.random() > 0.975) {
          columnsRef.current[i] = 0
        } else {
          columnsRef.current[i] = y + 1
        }
      })

      animFrameRef.current = requestAnimationFrame(draw)
    }

    animFrameRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // ── Boot sequence ────────────────────────────────────────
  useEffect(() => {
    const timers = BOOT_LINES.map((line, i) =>
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, i])
      }, line.delay + 300)
    )

    // Show SYSTEM READY after all lines
    const lastDelay = BOOT_LINES[BOOT_LINES.length - 1].delay
    const readyTimer = setTimeout(() => setShowReady(true), lastDelay + 700)

    // Begin exit after ready
    const exitTimer = setTimeout(() => triggerExit(), lastDelay + 1600)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(readyTimer)
      clearTimeout(exitTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const triggerExit = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setExiting(true)
    setTimeout(() => onComplete(), 900)
  }, [onComplete])

  // Any key skips
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Tab') e.preventDefault()
      triggerExit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [triggerExit])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#000A00',
        transition: 'opacity 0.9s ease',
        opacity: exiting ? 0 : 1,
      }}
      onClick={triggerExit}
    >
      {/* Matrix rain canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ opacity: 0.35 }}
      />

      {/* Vignette over the rain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* Terminal panel */}
      <div
        className="relative z-10 w-full max-w-lg px-8 py-8 font-mono"
        style={{ textShadow: '0 0 8px rgba(0,255,65,0.6)' }}
      >
        {/* Title */}
        <div className="mb-8 text-center">
          <p
            className="text-3xl tracking-[0.4em] text-text mb-1"
            style={{
              textShadow:
                '0 0 10px rgba(0,255,65,1), 0 0 30px rgba(0,255,65,0.5)',
            }}
          >
            TYPING.DEV
          </p>
          <p className="text-muted text-xs tracking-widest">v1.0.0 — CODE TRAINING SYSTEM</p>
        </div>

        {/* Divider */}
        <p className="text-muted text-xs mb-6 opacity-40">
          {'─'.repeat(52)}
        </p>

        {/* Boot lines */}
        <div className="space-y-1.5 text-xs mb-6">
          {BOOT_LINES.map((line, i) => (
            <div
              key={i}
              className="flex justify-between transition-opacity duration-200"
              style={{ opacity: visibleLines.includes(i) ? 1 : 0 }}
            >
              <span className="text-muted">{line.text}</span>
              <span className="text-success" style={{ textShadow: '0 0 6px #39FF14' }}>
                {line.suffix}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <p className="text-muted text-xs mb-6 opacity-40">
          {'─'.repeat(52)}
        </p>

        {/* Ready */}
        <div
          className="text-center transition-opacity duration-500"
          style={{ opacity: showReady ? 1 : 0 }}
        >
          <p
            className="text-text text-sm tracking-[0.3em] blink"
            style={{
              textShadow:
                '0 0 10px rgba(0,255,65,1), 0 0 20px rgba(0,255,65,0.6)',
            }}
          >
            SYSTEM READY
          </p>
        </div>

        {/* Skip hint */}
        <p className="text-center text-muted text-xs mt-8 opacity-30">
          press any key to continue
        </p>
      </div>
    </div>
  )
}
