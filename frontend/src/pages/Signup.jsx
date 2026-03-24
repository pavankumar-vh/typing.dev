import { useState, useEffect, useRef } from 'react'
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
function Field({ label, type, value, onChange, placeholder, autoFocus, autoComplete, hint, index = 0 }) {
  const [focused, setFocused] = useState(false)
  const filled = value.length > 0
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="auth-field"
    >
      <div className="auth-field-label-row">
        <label className="auth-field-label" style={{
          color: focused ? '#00FF41' : filled ? 'rgba(0,255,65,0.55)' : 'rgba(0,255,65,0.35)',
        }}>
          <span className="auth-field-prompt" style={{ opacity: focused ? 1 : 0.3 }}>❯</span>
          {label}
        </label>
        {hint && <span className="auth-field-hint">{hint}</span>}
      </div>
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
      }, 40)
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

/* ── Password strength bar ── */
function StrengthBar({ password }) {
  const score = !password ? 0 : Math.min(
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0), 4
  )
  const label = ['', 'weak', 'fair', 'good', 'strong'][score]
  const color = ['', '#FF4444', '#FF8C00', '#FFD700', '#00FF41'][score]
  if (!password) return null
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="auth-strength"
    >
      <div className="auth-strength-bars">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="auth-strength-segment">
            <motion.div
              className="auth-strength-fill"
              animate={{
                scaleX: i <= score ? 1 : 0,
                backgroundColor: i <= score ? color : 'rgba(0,255,65,0.1)',
              }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            />
          </div>
        ))}
      </div>
      <motion.span
        key={label}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-strength-label"
        style={{ color }}
      >
        {label}
      </motion.span>
    </motion.div>
  )
}

/* ── Step indicator ── */
function StepIndicator({ step }) {
  const steps = ['identity', 'credentials', 'confirm']
  return (
    <div className="auth-steps">
      {steps.map((s, i) => (
        <div key={s} className="auth-step-item">
          <motion.div
            className="auth-step-dot-wrap"
            animate={{
              borderColor: i <= step ? '#00FF41' : 'rgba(0,255,65,0.15)',
              boxShadow: i <= step ? '0 0 10px rgba(0,255,65,0.3)' : 'none',
            }}
          >
            <motion.div
              className="auth-step-dot-inner"
              animate={{
                scale: i <= step ? 1 : 0,
                backgroundColor: i < step ? '#00FF41' : i === step ? '#00FF41' : 'transparent',
              }}
            />
            {i < step && <span className="auth-step-check">{'\u2713'}</span>}
          </motion.div>
          <span className="auth-step-label" style={{
            color: i <= step ? 'rgba(0,255,65,0.7)' : 'rgba(0,255,65,0.2)',
          }}>{s}</span>
          {i < steps.length - 1 && (
            <div className="auth-step-line">
              <motion.div
                className="auth-step-line-fill"
                animate={{ scaleX: i < step ? 1 : 0 }}
                transition={{ duration: 0.4 }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [dots, setDots]               = useState('')

  const passwordsMatch    = confirm.length > 0 && password === confirm
  const passwordsMismatch = confirm.length > 0 && password !== confirm

  // Compute current step for indicator
  const step = !displayName ? 0 : !email ? 0 : !password ? 1 : !confirm ? 2 : 2

  async function handleSubmit(e) {
    e.preventDefault()
    if (!displayName || !email || !password || !confirm) { setError('all fields required'); return }
    if (password !== confirm)  { setError('passwords do not match'); return }
    if (password.length < 6)   { setError('password must be at least 6 characters'); return }
    setError('')
    setLoading(true)
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 350)
    try {
      await signup(email, password, displayName.trim())
      navigate('/')
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use' ? 'email already in use' :
        err.code === 'auth/weak-password'        ? 'password too weak \u2014 use at least 6 characters' :
        err.code === 'auth/invalid-email'        ? 'invalid email address' :
        err.message?.toLowerCase()               || 'signup failed'
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
          <span className="auth-chrome-title">typing.dev &mdash; /signup</span>
          <div className="auth-chrome-dots" style={{ visibility: 'hidden' }}>
            <span className="auth-chrome-dot" /><span className="auth-chrome-dot" /><span className="auth-chrome-dot" />
          </div>
        </motion.div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-scanline" />
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
              <span>system: create account</span>
            </div>
            <h1 className="auth-title">
              <span className="auth-title-prompt">&gt;_</span> signup
            </h1>
            <div className="auth-subtitle">
              <TypeWriter text="initialize your developer profile and join the grid" delay={600} />
            </div>
            <div className="auth-divider" />
          </motion.div>

          {/* Step indicator */}
          <StepIndicator step={step} />

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <Field label="display name" type="text" autoFocus index={0}
              value={displayName}
              onChange={e => setDisplayName(e.target.value.slice(0, 24))}
              placeholder="shown on leaderboard"
              hint={displayName ? `${displayName.length}/24` : ''} />

            <Field label="email address" type="email" autoComplete="email" index={1}
              value={email} onChange={e => setEmail(e.target.value)} placeholder="user@domain.com" />

            <div>
              <Field label="password" type="password" autoComplete="new-password" index={2}
                value={password} onChange={e => setPassword(e.target.value)} placeholder="min 6 characters" />
              <StrengthBar password={password} />
            </div>

            <div>
              <Field label="confirm password" type="password" autoComplete="new-password" index={3}
                value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'} />
              <AnimatePresence>
                {passwordsMatch && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="auth-match auth-match-ok"
                  >
                    <span>{'\u2713'}</span> passwords match
                  </motion.p>
                )}
                {passwordsMismatch && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="auth-match auth-match-err"
                  >
                    <span>{'\u2717'}</span> passwords do not match
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, x: -10 }}
                  animate={{ opacity: 1, height: 'auto', x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="auth-error"
                >
                  <div className="auth-error-inner">
                    <span className="auth-error-icon">{'\u26A0'}</span>
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
              transition={{ delay: 0.7 }}
              whileHover={!loading ? { scale: 1.01, boxShadow: '0 0 50px rgba(0,255,65,0.3), 0 0 100px rgba(0,255,65,0.1)' } : {}}
              whileTap={!loading ? { scale: 0.985 } : {}}
            >
              {loading ? (
                <span className="auth-submit-loading">
                  <span className="auth-submit-pulse" />
                  {`initializing${dots}`}
                </span>
              ) : (
                <span className="auth-submit-text">
                  create account<span className="auth-submit-arrow">{'\u2192'}</span>
                </span>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <motion.div
            className="auth-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span className="auth-footer-label">already have an account?</span>
            <Link to="/login" className="auth-footer-link auth-footer-link-primary">
              login <span>{'\u2192'}</span>
            </Link>
          </motion.div>
        </div>

        <motion.p
          className="auth-badge"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <span className="auth-badge-dot" />
          encrypted &middot; firebase auth
        </motion.p>
      </motion.div>
    </div>
  )
}
