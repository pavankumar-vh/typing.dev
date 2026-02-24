import { useEffect, useRef, useState } from 'react'

// Detects if a point is over a clickable element
function isClickable(el) {
  if (!el) return false
  const tag = el.tagName?.toLowerCase()
  if (['button', 'a', 'select', 'input', 'textarea', 'label'].includes(tag)) return true
  if (el.getAttribute?.('role') === 'button') return true
  if (el.getAttribute?.('tabindex') !== null && el.getAttribute?.('tabindex') !== '-1') return true
  return false
}

export default function CursorGlow() {
  const posRef   = useRef({ x: -100, y: -100 })
  const arrowRef = useRef(null)
  const [hover, setHover]   = useState(false)
  const [clicking, setClick] = useState(false)

  useEffect(() => {
    const onMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      setHover(isClickable(e.target) || isClickable(e.target?.closest?.('button,a,[role=button]')))

      if (arrowRef.current) {
        arrowRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      }
    }

    const onDown = () => setClick(true)
    const onUp   = () => setClick(false)

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [])

  const color    = clicking ? '#AAFFAA' : '#00FF41'
  const glow     = clicking ? '0 0 18px 4px rgba(0,255,65,0.65)'
                 : hover    ? '0 0 14px 3px rgba(0,255,65,0.5)'
                 :             '0 0 8px 2px rgba(0,255,65,0.25)'
  const scale    = clicking && hover ? 'scale(0.88)' : 'scale(1)'

  return (
    <div
      ref={arrowRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        willChange: 'transform',
        transformOrigin: '0 0',
      }}
    >
      {/* ── Arrow (default) ── */}
      <svg
        width="28" height="32" viewBox="0 0 28 32"
        style={{
          display: 'block',
          position: 'absolute',
          top: 0, left: 0,
          filter: `drop-shadow(${glow})`,
          opacity: hover ? 0 : clicking ? 1 : 0.85,
          transform: scale,
          transition: 'opacity 0.15s ease, filter 0.15s ease, transform 0.1s ease',
        }}
      >
        <polygon points="3,1 3,25 9,19 14,29 17,28 12,18 21,18"
          fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" opacity="0.2" />
        <polygon points="3,1 3,25 9,19 14,29 17,28 12,18 21,18"
          fill="#000A00" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      </svg>

      {/* ── Hand pointer (hover) ── */}
      <svg
        width="22" height="28" viewBox="0 0 22 28"
        style={{
          display: 'block',
          position: 'absolute',
          top: 0, left: 0,
          filter: `drop-shadow(${glow})`,
          opacity: hover ? (clicking ? 0.95 : 0.9) : 0,
          transform: scale,
          transition: 'opacity 0.15s ease, filter 0.15s ease, transform 0.1s ease',
        }}
      >
        {/* index finger — tall, extends from top */}
        <rect x="2" y="1" width="5" height="17" rx="2.5" fill="#000A00" stroke={color} strokeWidth="1.3" />
        {/* middle finger — curled, starts much lower */}
        <rect x="7" y="10" width="4" height="8" rx="2" fill="#000A00" stroke={color} strokeWidth="1.2" />
        {/* ring finger — curled, even lower */}
        <rect x="11" y="11.5" width="3.5" height="6.5" rx="1.75" fill="#000A00" stroke={color} strokeWidth="1.1" />
        {/* pinky — curled, shortest */}
        <rect x="14.5" y="13" width="3" height="5" rx="1.5" fill="#000A00" stroke={color} strokeWidth="1.1" />
        {/* palm */}
        <path
          d="M 2 16 Q 1 24 5 27 L 15 27 Q 19 24 17.5 16"
          fill="#000A00" stroke={color} strokeWidth="1.3" strokeLinejoin="round"
        />
        {/* fingertip glow on index */}
        <rect x="2" y="1" width="5" height="5" rx="2.5"
          fill={color} opacity={clicking ? 0.5 : 0.18} />
      </svg>
    </div>
  )
}
