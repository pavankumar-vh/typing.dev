import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'

/* ── Matrix rain background ── */
function MatrixRain() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    let raf
    const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ01'.split('')
    const fontSize = 14
    let columns, drops

    function resize() {
      cvs.width = cvs.offsetWidth * devicePixelRatio
      cvs.height = cvs.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
      columns = Math.floor(cvs.offsetWidth / fontSize)
      drops = Array.from({ length: columns }, () => Math.random() * -100)
    }
    resize()
    window.addEventListener('resize', resize)

    function draw() {
      ctx.fillStyle = 'rgba(0,2,0,0.12)'
      ctx.fillRect(0, 0, cvs.offsetWidth, cvs.offsetHeight)
      ctx.fillStyle = 'rgba(0,255,65,0.12)'
      ctx.font = `${fontSize}px monospace`
      for (let i = 0; i < columns; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize)
        if (drops[i] * fontSize > cvs.offsetHeight && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="auth-matrix-canvas" />
}

/* ── Animated input field ── */
function Field({ label, type, value, onChange, placeholder, autoFocus, autoComplete, index = 0 }) {
  const [focused, setFocused] = useState(false)
  const filled = value.length > 0
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="auth-field"
    >
      <label className="auth-field-label" style={{
        color: focused ? '#00FF41' : filled ? 'rgba(0,255,65,0.55)' : 'rgba(0,255,65,0.35)',
      }}>
        <span className="auth-field-prompt" style={{ opacity: focused ? 1 : 0.3 }}>❯</span>
        {label}
      </label>
      <div className="auth-field-input-wrap">
        <input
          type={type}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="auth-field-input"
        />
        <div className="auth-field-line" style={{
          transform: focused ? 'scaleX(1)' : 'scaleX(0)',
          opacity: focused ? 1 : 0,
        }} />
        <div className="auth-field-line-bg" />
        {focused && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="auth-field-dot"
          />
        )}
      </div>
    </motion.div>
  )
}

/* ── Typing subtitle ── */
function TypeWriter({ text, delay = 0 }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    let i = 0
    const timeout = setTimeout(() => {
      const iv = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) clearInterval(iv)
      }, 45)
      return () => clearInterval(iv)
    }, delay)
    return () => clearTimeout(timeout)
  }, [text, delay])
  return (
    <span className="auth-typewriter">
      {displayed}
      <span className="auth-cursor">▊</span>
    </span>
  )
}

/* ── Floating particles ── */
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 2,
  dur: 8 + Math.random() * 12,
  delay: Math.random() * 5,
}))

function Particles() {
  return (
    <div className="auth-particles">
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="auth-particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dots, setDots] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('please fill in all fields'); return }
    setError('')
    setLoading(true)
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 350)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const msg =
        err.code === 'auth/user-not-found'    ? 'no account found with that email' :
        err.code === 'auth/wrong-password'    ? 'incorrect password' :
        err.code === 'auth/invalid-email'     ? 'invalid email address' :
        err.code === 'auth/too-many-requests' ? 'too many attempts — try again later' :
        err.message?.toLowerCase()            || 'login failed'
      setError(msg)
    } finally {
      clearInterval(iv)
      setLoading(false)
      setDots('')
    }
  }

  return (
    <div className="auth-page">
      <MatrixRain />
      <Particles />

      {/* Radial glow */}
      <div className="auth-glow" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="auth-container"
      >
        {/* Window chrome */}
        <motion.div
          className="auth-chrome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="auth-chrome-dots">
            {['#FF5F57', '#FFBD2E', '#28CA41'].map((c, i) => (
              <motion.span
                key={c}
                className="auth-chrome-dot"
                style={{ background: c, boxShadow: `0 0 6px ${c}66` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 500 }}
              />
            ))}
          </div>
          <span className="auth-chrome-title">typing.dev — /login</span>
          <div className="auth-chrome-dots" style={{ visibility: 'hidden' }}>
            <span className="auth-chrome-dot" /><span className="auth-chrome-dot" /><span className="auth-chrome-dot" />
          </div>
        </motion.div>

        {/* Card */}
        <div className="auth-card">
          {/* Scan line */}
          <div className="auth-scanline" />
          {/* Corner decorations */}
          <div className="auth-corner auth-corner-tl" />
          <div className="auth-corner auth-corner-tr" />
          <div className="auth-corner auth-corner-bl" />
          <div className="auth-corner auth-corner-br" />

          {/* Header */}
          <motion.div
            className="auth-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="auth-status-line">
              <span className="auth-status-dot" />
              <span>system: authenticate</span>
            </div>
            <h1 className="auth-title">
              <span className="auth-title-prompt">&gt;_</span> login
            </h1>
            <div className="auth-subtitle">
              <TypeWriter text="enter credentials to access your terminal session" delay={600} />
            </div>
            <div className="auth-divider" />
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <Field label="email address" type="email" autoFocus autoComplete="email" index={0}
              value={email} onChange={e => setEmail(e.target.value)} placeholder="user@domain.com" />

            <Field label="password" type="password" autoComplete="current-password" index={1}
              value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, x: -10 }}
                  animate={{ opacity: 1, height: 'auto', x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="auth-error"
                >
                  <div className="auth-error-inner">
                    <span className="auth-error-icon">⚠</span>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              className="auth-submit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              whileHover={!loading ? { scale: 1.01, boxShadow: '0 0 50px rgba(0,255,65,0.3), 0 0 100px rgba(0,255,65,0.1)' } : {}}
              whileTap={!loading ? { scale: 0.985 } : {}}
            >
              {loading ? (
                <span className="auth-submit-loading">
                  <span className="auth-submit-pulse" />
                  {`authenticating${dots}`}
                </span>
              ) : (
                <span className="auth-submit-text">
                  login<span className="auth-submit-arrow">→</span>
                </span>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <motion.div
            className="auth-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
          >
            <span className="auth-footer-label">no account yet?</span>
            <div className="auth-footer-links">
              <Link to="/signup" className="auth-footer-link auth-footer-link-primary">
                create account <span>→</span>
              </Link>
              <Link to="/" className="auth-footer-link auth-footer-link-skip">
                &gt; skip
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Bottom badge */}
        <motion.p
          className="auth-badge"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <span className="auth-badge-dot" />
          secured · firebase auth
        </motion.p>
      </motion.div>
    </div>
  )
}
