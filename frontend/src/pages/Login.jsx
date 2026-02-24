import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function InputField({ label, type, value, onChange, placeholder, autoFocus, autoComplete }) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs tracking-[0.25em] uppercase transition-all"
        style={{ color: focused ? '#00FF41' : 'rgba(0,255,65,0.4)' }}>
        {label}
      </label>
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
          className="bg-transparent text-text tracking-wide outline-none py-2 text-sm w-full placeholder:opacity-20 placeholder:text-muted transition-all"
          style={{
            borderBottom: `1px solid ${focused ? '#00FF41' : 'rgba(0,255,65,0.2)'}`,
            boxShadow: focused ? '0 1px 0 0 rgba(0,255,65,0.3)' : 'none',
            caretColor: '#00FF41',
          }}
        />
      </div>
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [dots, setDots]         = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('all fields required'); return }
    setError('')
    setLoading(true)
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'invalid email or password'
        : err.code === 'auth/too-many-requests'
        ? 'too many attempts — try again later'
        : err.message?.toLowerCase() || 'login failed'
      setError(msg)
    } finally {
      clearInterval(iv)
      setLoading(false)
      setDots('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,65,0.03) 0%, transparent 70%)' }}>

      {/* Outer card */}
      <div className="w-full max-w-sm" style={{
        border: '1px solid rgba(0,255,65,0.12)',
        background: 'rgba(0,255,65,0.02)',
        padding: '2.5rem 2rem',
        boxShadow: '0 0 40px rgba(0,255,65,0.05), inset 0 0 40px rgba(0,0,0,0.2)',
      }}>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl font-bold tracking-[0.15em] glow-text" style={{ color: '#00FF41' }}>&gt;_</span>
            <span className="text-lg font-bold tracking-[0.15em] text-text">typing.dev</span>
          </div>
          <div style={{ borderLeft: '2px solid rgba(0,255,65,0.3)', paddingLeft: '0.75rem' }}>
            <p className="text-xs tracking-widest mb-1" style={{ color: 'rgba(0,255,65,0.5)' }}>system: auth required</p>
            <p className="text-xs tracking-widest" style={{ color: 'rgba(0,255,65,0.3)' }}>session: login to continue</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-8" style={{ height: '1px', background: 'linear-gradient(to right, rgba(0,255,65,0.2), transparent)' }} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          <InputField
            label="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@domain.com"
          />

          <InputField
            label="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />

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
            className="text-sm tracking-[0.2em] py-3 font-bold transition-all mt-1 uppercase disabled:opacity-40 cursor-pointer"
            style={{
              background: loading ? 'rgba(0,255,65,0.15)' : '#00FF41',
              color: loading ? '#00FF41' : '#000',
              border: loading ? '1px solid rgba(0,255,65,0.4)' : '1px solid #00FF41',
              boxShadow: loading ? 'none' : '0 0 20px rgba(0,255,65,0.3)',
            }}
          >
            {loading ? `authenticating${dots}` : 'login'}
          </button>

        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 flex flex-col gap-3" style={{ borderTop: '1px solid rgba(0,255,65,0.08)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs tracking-widest" style={{ color: 'rgba(0,255,65,0.35)' }}>no account?</span>
            <Link to="/signup" className="text-xs tracking-widest transition-all hover:opacity-80"
              style={{ color: '#00FF41', textShadow: '0 0 8px rgba(0,255,65,0.4)' }}>
              create account →
            </Link>
          </div>
          <Link to="/" className="text-xs tracking-widest transition-all hover:opacity-60"
            style={{ color: 'rgba(0,255,65,0.25)' }}>
            &gt; continue without login
          </Link>
        </div>

      </div>
    </div>
  )
}
