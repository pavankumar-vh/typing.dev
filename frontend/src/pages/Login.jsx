import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function TerminalLine({ children, dim }) {
  return (
    <p className={`text-xs tracking-widest select-none mb-1 ${dim ? 'opacity-30' : 'opacity-60'} text-muted`}>
      {children}
    </p>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('all fields required'); return }
    setError('')
    setLoading(true)
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
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Terminal header */}
        <div className="mb-10">
          <p className="text-xl glow-text text-text font-bold tracking-[0.15em] mb-4">
            &gt;_ typing.dev
          </p>
          <TerminalLine>system: auth required</TerminalLine>
          <TerminalLine>session: login to save your scores</TerminalLine>
          <TerminalLine dim>─────────────────────────────</TerminalLine>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-7">

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-xs tracking-[0.25em] text-muted opacity-50 uppercase">
              email
            </label>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@domain.com"
              className="bg-transparent border-b text-text tracking-wide outline-none py-2 text-base w-full placeholder:opacity-20 placeholder:text-muted"
              style={{ borderColor: 'rgba(0,255,65,0.3)', caretColor: '#00FF41' }}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-xs tracking-[0.25em] text-muted opacity-50 uppercase">
              password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-transparent border-b text-text tracking-wide outline-none py-2 text-base w-full placeholder:opacity-20 placeholder:text-muted"
              style={{ borderColor: 'rgba(0,255,65,0.3)', caretColor: '#00FF41' }}
            />
          </div>

          {/* Error */}
          {error && (
            <p
              className="text-xs tracking-widest py-3 px-4"
              style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: '#FF4444' }}
            >
              &gt; error: {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="text-sm tracking-widest py-3 font-bold transition-all mt-2 text-bg disabled:opacity-40"
            style={{ background: '#00FF41', boxShadow: loading ? 'none' : '0 0 16px rgba(0,255,65,0.45)' }}
          >
            {loading ? 'authenticating...' : 'login'}
          </button>

        </form>

        {/* Footer */}
        <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(0,255,65,0.1)' }}>
          <TerminalLine>no account?</TerminalLine>
          <Link
            to="/signup"
            className="text-xs tracking-widest text-text glow-text hover:opacity-80 transition-all"
          >
            &gt; create account
          </Link>
        </div>

        <div className="mt-6">
          <Link
            to="/"
            className="text-xs tracking-widest text-muted opacity-40 hover:opacity-70 transition-all"
          >
            &gt; continue without login
          </Link>
        </div>

      </div>
    </div>
  )
}
