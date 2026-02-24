import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function InputField({ label, type, value, onChange, placeholder, autoFocus, autoComplete, hint }) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs tracking-[0.25em] uppercase transition-all"
          style={{ color: focused ? '#00FF41' : 'rgba(0,255,65,0.4)' }}>
          {label}
        </label>
        {hint && <span className="text-xs" style={{ color: 'rgba(0,255,65,0.3)' }}>{hint}</span>}
      </div>
      <input
        type={type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="bg-transparent text-text tracking-wide outline-none py-2.5 text-sm w-full placeholder:opacity-20 placeholder:text-muted transition-all"
        style={{
          borderBottom: `1px solid ${focused ? '#00FF41' : 'rgba(0,255,65,0.2)'}`,
          boxShadow: focused ? '0 1px 0 0 rgba(0,255,65,0.3)' : 'none',
          caretColor: '#00FF41',
        }}
      />
    </div>
  )
}

function PasswordStrength({ password }) {
  const score = Math.min(
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0),
    4
  )
  const labels = ['', 'weak', 'fair', 'good', 'strong']
  const colors = ['', '#FF4444', '#FF8800', '#FFCC00', '#00FF41']
  if (!password) return null
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1 flex-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-0.5 flex-1 transition-all"
            style={{ background: i <= score ? colors[score] : 'rgba(0,255,65,0.1)' }} />
        ))}
      </div>
      <span className="text-xs tracking-widest" style={{ color: colors[score], minWidth: '3rem', textAlign: 'right' }}>
        {labels[score]}
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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!displayName || !email || !password || !confirm) {
      setError('all fields required'); return
    }
    if (password !== confirm) {
      setError('passwords do not match'); return
    }
    if (password.length < 6) {
      setError('password must be at least 6 characters'); return
    }
    setError('')
    setLoading(true)
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400)
    try {
      await signup(email, password, displayName.trim())
      navigate('/')
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'email already in use'
        : err.code === 'auth/weak-password'
        ? 'password too weak — use at least 6 characters'
        : err.code === 'auth/invalid-email'
        ? 'invalid email address'
        : err.message?.toLowerCase() || 'signup failed'
      setError(msg)
    } finally {
      clearInterval(iv)
      setLoading(false)
      setDots('')
    }
  }

  const passwordsMatch = confirm.length > 0 && password === confirm
  const passwordsMismatch = confirm.length > 0 && password !== confirm

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,65,0.03) 0%, transparent 70%)' }}>

      {/* Outer card */}
      <div className="w-full max-w-sm" style={{
        border: '1px solid rgba(0,255,65,0.15)',
        background: 'rgba(0,255,65,0.02)',
        padding: '3rem 2.5rem',
        boxShadow: '0 0 60px rgba(0,255,65,0.06), inset 0 0 40px rgba(0,0,0,0.2)',
      }}>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl font-bold tracking-[0.15em] glow-text" style={{ color: '#00FF41' }}>&gt;_</span>
            <span className="text-lg font-bold tracking-[0.15em] text-text">typing.dev</span>
          </div>
          <div style={{ borderLeft: '2px solid rgba(0,255,65,0.3)', paddingLeft: '0.875rem' }}>
            <p className="text-xs tracking-widest mb-2" style={{ color: 'rgba(0,255,65,0.55)' }}>system: create new account</p>
            <p className="text-xs tracking-widest" style={{ color: 'rgba(0,255,65,0.3)' }}>scores saved to your profile</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-10" style={{ height: '1px', background: 'linear-gradient(to right, rgba(0,255,65,0.25), transparent)' }} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          <InputField
            label="display name"
            type="text"
            autoFocus
            value={displayName}
            onChange={e => setDisplayName(e.target.value.slice(0, 24))}
            placeholder="appears on leaderboard"
            hint={displayName ? `${displayName.length}/24` : ''}
          />

          <InputField
            label="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@domain.com"
          />

          <div className="flex flex-col gap-3">
            <InputField
              label="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="min 6 characters"
            />
            <PasswordStrength password={password} />
          </div>

          <div className="flex flex-col gap-3">
            <InputField
              label="confirm password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
            {passwordsMatch && (
              <p className="text-xs tracking-widest" style={{ color: '#00FF41' }}>✓ passwords match</p>
            )}
            {passwordsMismatch && (
              <p className="text-xs tracking-widest" style={{ color: '#FF4444' }}>✗ passwords do not match</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs tracking-widest py-2.5 px-3 flex items-start gap-2"
              style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)', color: '#FF4444' }}>
              <span className="opacity-60 shrink-0">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="text-sm tracking-[0.2em] py-3.5 font-bold transition-all mt-2 uppercase disabled:opacity-40 cursor-pointer"
            style={{
              background: loading ? 'rgba(0,255,65,0.15)' : '#00FF41',
              color: loading ? '#00FF41' : '#000',
              border: loading ? '1px solid rgba(0,255,65,0.4)' : '1px solid #00FF41',
              boxShadow: loading ? 'none' : '0 0 20px rgba(0,255,65,0.3)',
            }}
          >
            {loading ? `initializing${dots}` : 'create account'}
          </button>

        </form>

        {/* Footer */}
        <div className="mt-10 pt-7 flex items-center justify-between" style={{ borderTop: '1px solid rgba(0,255,65,0.1)' }}>
          <span className="text-xs tracking-widest" style={{ color: 'rgba(0,255,65,0.35)' }}>have an account?</span>
          <Link to="/login" className="text-xs tracking-widest transition-all hover:opacity-80"
            style={{ color: '#00FF41', textShadow: '0 0 8px rgba(0,255,65,0.4)' }}>
            login →
          </Link>
        </div>

      </div>
    </div>
  )
}
