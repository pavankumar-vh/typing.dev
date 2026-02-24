import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'

function Field({ label, type, value, onChange, placeholder, autoFocus, autoComplete, hint }) {
  const [focused, setFocused] = useState(false)
  const filled = value.length > 0
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label
          className="text-xs tracking-[0.3em] uppercase font-medium transition-colors duration-200"
          style={{ color: focused ? '#00FF41' : filled ? 'rgba(0,255,65,0.55)' : 'rgba(0,255,65,0.35)' }}
        >
          {label}
        </label>
        {hint && (
          <span className="text-xs tabular-nums" style={{ color: 'rgba(0,255,65,0.28)', letterSpacing: '0.1em' }}>
            {hint}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type={type}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="bg-transparent text-text tracking-wide outline-none w-full text-base transition-all duration-200 placeholder:text-muted placeholder:opacity-15"
          style={{
            padding: '0.875rem 1.5rem 0.875rem 0',
            borderBottom: `1px solid ${focused ? '#00FF41' : 'rgba(0,255,65,0.18)'}`,
            boxShadow: focused ? '0 2px 0 -1px rgba(0,255,65,0.2)' : 'none',
            caretColor: '#00FF41',
          }}
        />
        {focused && (
          <span className="absolute right-0 bottom-4 w-1.5 h-1.5 rounded-full"
            style={{ background: '#00FF41', boxShadow: '0 0 8px rgba(0,255,65,0.9)' }} />
        )}
      </div>
    </div>
  )
}

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
    <div className="flex items-center gap-4 pt-1">
      <div className="flex gap-1.5 flex-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 rounded-full transition-all duration-300"
            style={{ height: '3px', background: i <= score ? color : 'rgba(0,255,65,0.1)' }} />
        ))}
      </div>
      <span className="text-xs tracking-[0.2em] w-12 text-right transition-colors duration-300"
        style={{ color }}>
        {label}
      </span>
    </div>
  )
}

export default function Signup() {
  const { signup } = useAuth()
  const navigate   = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [dots, setDots]               = useState('')

  const passwordsMatch    = confirm.length > 0 && password === confirm
  const passwordsMismatch = confirm.length > 0 && password !== confirm

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
        err.code === 'auth/weak-password'        ? 'password too weak — use at least 6 characters' :
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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(0,255,65,0.04) 0%, transparent 65%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full"
        style={{ maxWidth: '440px' }}
      >

        {/* Window chrome */}
        <div className="flex items-center gap-3 mb-8 px-1">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57', boxShadow: '0 0 6px rgba(255,95,87,0.5)' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E', boxShadow: '0 0 6px rgba(255,189,46,0.4)' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#28CA41', boxShadow: '0 0 6px rgba(40,202,65,0.5)' }} />
          </div>
          <span className="text-xs tracking-[0.3em] uppercase" style={{ color: 'rgba(0,255,65,0.25)' }}>
            typing.dev — /signup
          </span>
        </div>

        {/* Card */}
        <div style={{
          border: '1px solid rgba(0,255,65,0.14)',
          background: 'linear-gradient(160deg, rgba(0,255,65,0.025) 0%, rgba(0,0,0,0) 100%)',
          padding: '4rem 3.5rem',
          boxShadow: '0 0 100px rgba(0,255,65,0.04), 0 1px 0 0 rgba(0,255,65,0.1) inset',
        }}>

          {/* Header */}
          <div className="mb-14">
            <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: 'rgba(0,255,65,0.3)' }}>
              system: create account
            </p>
            <h1 className="text-4xl font-bold tracking-[0.05em]" style={{ color: '#00FF41', textShadow: '0 0 40px rgba(0,255,65,0.35)' }}>
              &gt;_ signup
            </h1>
            <div className="mt-4 h-px w-16" style={{ background: 'rgba(0,255,65,0.3)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-10">

            <Field label="display name" type="text" autoFocus
              value={displayName}
              onChange={e => setDisplayName(e.target.value.slice(0, 24))}
              placeholder="shown on leaderboard"
              hint={displayName ? `${displayName.length} / 24` : ''} />

            <Field label="email address" type="email" autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)} placeholder="user@domain.com" />

            <div className="flex flex-col gap-4">
              <Field label="password" type="password" autoComplete="new-password"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="min 6 characters" />
              <StrengthBar password={password} />
            </div>

            <div className="flex flex-col gap-3">
              <Field label="confirm password" type="password" autoComplete="new-password"
                value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
              {passwordsMatch && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-xs tracking-[0.2em]" style={{ color: '#00FF41' }}>
                  ✓ passwords match
                </motion.p>
              )}
              {passwordsMismatch && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-xs tracking-[0.2em]" style={{ color: '#FF5555' }}>
                  ✗ passwords do not match
                </motion.p>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 text-xs tracking-widest py-4 px-4"
                style={{
                  background: 'rgba(255,68,68,0.05)',
                  border: '1px solid rgba(255,68,68,0.15)',
                  borderLeft: '3px solid rgba(255,68,68,0.55)',
                  color: '#FF7070',
                }}
              >
                <span className="shrink-0 mt-0.5 opacity-70">!</span>
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="text-sm tracking-[0.3em] py-4 font-bold transition-all duration-200 uppercase disabled:opacity-50 cursor-pointer"
              style={{
                background: loading ? 'transparent' : '#00FF41',
                color: loading ? '#00FF41' : '#000',
                border: `1px solid ${loading ? 'rgba(0,255,65,0.3)' : '#00FF41'}`,
                boxShadow: loading ? 'none' : '0 0 40px rgba(0,255,65,0.2), 0 0 0 1px rgba(0,255,65,0.1)',
                marginTop: '0.5rem',
              }}
            >
              {loading
                ? <span className="flex items-center justify-center gap-3">
                    <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00FF41' }} />
                    {`initializing${dots}`}
                  </span>
                : 'create account \u2192'
              }
            </button>

          </form>

          {/* Footer */}
          <div className="mt-14 pt-8 flex items-center justify-between" style={{ borderTop: '1px solid rgba(0,255,65,0.07)' }}>
            <span className="text-xs tracking-widest" style={{ color: 'rgba(0,255,65,0.28)' }}>
              already have an account?
            </span>
            <Link to="/login"
              className="text-xs tracking-[0.2em] font-medium transition-opacity duration-150 hover:opacity-70"
              style={{ color: '#00FF41', textShadow: '0 0 12px rgba(0,255,65,0.3)' }}>
              login \u2192
            </Link>
          </div>

        </div>

        <p className="text-center mt-5 text-xs" style={{ color: 'rgba(0,255,65,0.12)', letterSpacing: '0.2em' }}>
          encrypted · mongodb atlas
        </p>

      </motion.div>
    </div>
  )
}
