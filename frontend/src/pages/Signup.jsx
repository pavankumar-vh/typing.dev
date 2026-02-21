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

export default function Signup() {
  const { signup } = useAuth()
  const navigate   = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

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
          <TerminalLine>system: create new account</TerminalLine>
          <TerminalLine>scores will be saved under your profile</TerminalLine>
          <TerminalLine dim>─────────────────────────────</TerminalLine>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-7">

          {/* Display Name */}
          <div className="flex flex-col gap-2">
            <label className="text-xs tracking-[0.25em] text-muted opacity-50 uppercase">
              display name
            </label>
            <input
              type="text"
              autoFocus
              maxLength={24}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="how you appear on leaderboard"
              className="bg-transparent border-b text-text tracking-wide outline-none py-2 text-base w-full placeholder:opacity-20 placeholder:text-muted"
              style={{ borderColor: 'rgba(0,255,65,0.3)', caretColor: '#00FF41' }}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-xs tracking-[0.25em] text-muted opacity-50 uppercase">
              email
            </label>
            <input
              type="email"
              autoComplete="email"
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 6 characters"
              className="bg-transparent border-b text-text tracking-wide outline-none py-2 text-base w-full placeholder:opacity-20 placeholder:text-muted"
              style={{ borderColor: 'rgba(0,255,65,0.3)', caretColor: '#00FF41' }}
            />
          </div>

          {/* Confirm */}
          <div className="flex flex-col gap-2">
            <label className="text-xs tracking-[0.25em] text-muted opacity-50 uppercase">
              confirm password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? 'creating account...' : 'create account'}
          </button>

        </form>

        {/* Footer */}
        <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(0,255,65,0.1)' }}>
          <TerminalLine>already have an account?</TerminalLine>
          <Link
            to="/login"
            className="text-xs tracking-widest text-text glow-text hover:opacity-80 transition-all"
          >
            &gt; login
          </Link>
        </div>

      </div>
    </div>
  )
}
