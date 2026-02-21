import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConfig, LANGUAGES, DURATIONS } from '../context/ConfigContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const AVATAR_COLORS = [
  '#00FF41', '#39FF14', '#00FFCC', '#FFD700',
  '#FF6B6B', '#C77DFF', '#48CAE4', '#F8961E',
]

/* ── Shared section wrapper ──────────────────────────────── */
function Section({ label, children }) {
  return (
    <div className="mb-10">
      {/* section label with ruled line */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-xs tracking-[0.25em] text-muted opacity-50 uppercase select-none whitespace-nowrap">
          {label}
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(0,255,65,0.1)' }} />
      </div>
      {children}
    </div>
  )
}

/* ── Field: label above, content below ──────────────────── */
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs tracking-widest text-muted opacity-45 uppercase select-none">{label}</span>
      {children}
    </div>
  )
}

/* ── Stat card ───────────────────────────────────────────── */
function StatCard({ label, value }) {
  return (
    <div
      className="flex flex-col gap-3 px-6 py-5"
      style={{ border: '1px solid rgba(0,255,65,0.1)', background: 'rgba(0,20,0,0.3)' }}
    >
      <span className="text-xs tracking-[0.2em] text-muted opacity-50 uppercase select-none">{label}</span>
      <span className="text-4xl glow-text text-text tabular-nums leading-none">{value}</span>
    </div>
  )
}

function AvatarPreview({ name, color, size = 72 }) {
  const initials = name
    ? name.trim().split(/\s+/).map((w) => w[0].toUpperCase()).slice(0, 2).join('')
    : '?'
  return (
    <div
      className="flex items-center justify-center font-bold select-none flex-shrink-0"
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(0,10,0,0.9)',
        border: `2px solid ${color}`,
        color,
        fontSize: size * 0.34,
        boxShadow: `0 0 16px ${color}44, 0 0 32px ${color}18`,
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {initials}
    </div>
  )
}

export default function Profile() {
  const { language, setLanguage, duration, setDuration } = useConfig()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [logoutLoading, setLogoutLoading] = useState(false)

  async function handleLogout() {
    setLogoutLoading(true)
    try { await logout(); navigate('/') } finally { setLogoutLoading(false) }
  }

  const [name, setName]         = useState(() => localStorage.getItem('profile_name') || '')
  const [color, setColor]       = useState(() => localStorage.getItem('profile_color') || '#00FF41')
  const [editName, setEditName] = useState('')
  const [editing, setEditing]   = useState(false)
  const [saved, setSaved]       = useState(false)

  const [stats, setStats]       = useState(null)
  const [recent, setRecent]     = useState([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/sessions/stats`).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/api/sessions?limit=5&sort=newest`).then((r) => r.json()).catch(() => null),
    ]).then(([statsRes, recentRes]) => {
      if (statsRes?.success) setStats(statsRes.data)
      if (recentRes?.success) setRecent(recentRes.data)
    }).finally(() => setLoadingStats(false))
  }, [])

  function startEdit() { setEditName(name); setEditing(true); setSaved(false) }

  function saveProfile() {
    const trimmed = editName.trim().slice(0, 24)
    setName(trimmed)
    localStorage.setItem('profile_name', trimmed)
    localStorage.setItem('profile_color', color)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleColorPick(c) {
    setColor(c)
    localStorage.setItem('profile_color', c)
  }

  const global   = stats?.global
  const byLang   = stats?.byLanguage ?? []
  const bestLang = byLang.length ? byLang.reduce((a, b) => (a.topWpm > b.topWpm ? a : b)) : null

  return (
    <div className="min-h-[calc(100vh-53px)] flex flex-col items-center px-8 pt-14 pb-28">
      <div className="w-full max-w-2xl">

        {/* page breadcrumb */}
        <p className="text-xs tracking-[0.3em] text-muted opacity-40 mb-14 select-none uppercase">
          &gt;&nbsp; profile
        </p>

        {/* ══════════════════════════════════════════════════ */}
        {/* SECTION 0 — Account (Firebase)                   */}
        {/* ══════════════════════════════════════════════════ */}
        {user ? (
          <Section label="account">
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ border: '1px solid rgba(0,255,65,0.1)', background: 'rgba(0,20,0,0.3)' }}
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-text text-sm tracking-wide">{user.displayName || 'no display name'}</span>
                <span className="text-muted text-xs tracking-widest opacity-50">{user.email}</span>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/my-stats"
                  className="text-xs tracking-widest text-muted opacity-50 hover:opacity-80 hover:text-text transition-all"
                >
                  my stats →
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="text-xs tracking-widest px-4 py-2 border transition-all disabled:opacity-40"
                  style={{ borderColor: 'rgba(255,68,68,0.3)', color: 'rgba(255,68,68,0.7)' }}
                >
                  {logoutLoading ? 'logging out...' : 'logout'}
                </button>
              </div>
            </div>
          </Section>
        ) : (
          <Section label="account">
            <div className="flex items-center gap-6">
              <p className="text-muted text-sm tracking-widest opacity-50">not logged in</p>
              <Link
                to="/login"
                className="text-xs tracking-widest text-text glow-text hover:opacity-80 transition-all"
              >
                &gt; login
              </Link>
              <Link
                to="/signup"
                className="text-xs tracking-widest text-muted opacity-50 hover:opacity-80 hover:text-text transition-all"
              >
                &gt; create account
              </Link>
            </div>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* SECTION 1 — Identity                              */}
        {/* ══════════════════════════════════════════════════ */}
        <Section label="identity">
          <div className="flex items-start gap-10">
            <AvatarPreview name={name} color={color} size={80} />

            <div className="flex-1 min-w-0">
              {!editing ? (
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-2xl glow-text text-text tracking-wide font-bold leading-tight">
                      {name || <span className="opacity-30 font-normal text-xl">anonymous</span>}
                    </p>
                    <p className="text-xs tracking-widest text-muted opacity-40 mt-1">
                      {name ? 'display name' : 'no name set'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={startEdit}
                      className="text-xs tracking-widest px-5 py-2.5 border transition-all hover:border-text/50"
                      style={{ borderColor: 'rgba(0,255,65,0.25)', color: 'rgba(0,255,65,0.65)' }}
                    >
                      {name ? 'edit profile' : 'set up profile'}
                    </button>
                    {saved && (
                      <span className="text-xs text-text glow-text opacity-70 tracking-widest">saved ✓</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-7">

                  {/* Name input */}
                  <Field label="display name">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveProfile()
                        if (e.key === 'Escape') setEditing(false)
                      }}
                      maxLength={24}
                      placeholder="your name..."
                      className="w-full bg-transparent border-b text-text text-lg tracking-wide outline-none py-1.5"
                      style={{ borderColor: 'rgba(0,255,65,0.35)', caretColor: '#00FF41' }}
                    />
                    <span className="text-xs text-muted opacity-30 tracking-widest">
                      enter to save &nbsp;·&nbsp; esc to cancel
                    </span>
                  </Field>

                  {/* Color picker */}
                  <Field label="avatar colour">
                    <div className="flex gap-4 flex-wrap pt-1">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => handleColorPick(c)}
                          title={c}
                          style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: c,
                            boxShadow: color === c ? `0 0 12px ${c}` : 'none',
                            border: color === c ? '2px solid #fff' : '2px solid transparent',
                            transition: 'all 0.15s',
                          }}
                        />
                      ))}
                    </div>
                  </Field>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={saveProfile}
                      className="text-xs tracking-widest px-6 py-2.5 font-bold transition-all text-bg"
                      style={{ background: '#00FF41', boxShadow: '0 0 14px rgba(0,255,65,0.45)' }}
                    >
                      save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="text-xs tracking-widest px-5 py-2.5 border transition-all"
                      style={{ borderColor: 'rgba(0,255,65,0.18)', color: 'rgba(0,255,65,0.4)' }}
                    >
                      cancel
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════ */}
        {/* SECTION 2 — Default settings                      */}
        {/* ══════════════════════════════════════════════════ */}
        <Section label="default settings">
          <div className="flex flex-col gap-8">

            <Field label="language">
              <div className="flex gap-1 pt-1">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLanguage(l); localStorage.setItem('pref_lang', l) }}
                    className={`px-4 py-2 text-sm tracking-widest transition-all ${
                      language === l
                        ? 'text-text glow-text border-b'
                        : 'text-muted opacity-40 hover:opacity-80 hover:text-text'
                    }`}
                    style={language === l ? { borderColor: 'rgba(0,255,65,0.5)' } : {}}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="duration">
              <div className="flex gap-1 pt-1">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDuration(d); localStorage.setItem('pref_dur', String(d)) }}
                    className={`px-4 py-2 text-sm tracking-widest transition-all ${
                      duration === d
                        ? 'text-text glow-text border-b'
                        : 'text-muted opacity-40 hover:opacity-80 hover:text-text'
                    }`}
                    style={duration === d ? { borderColor: 'rgba(0,255,65,0.5)' } : {}}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </Field>

          </div>
        </Section>

        {/* ══════════════════════════════════════════════════ */}
        {/* SECTION 3 — Stats                                 */}
        {/* ══════════════════════════════════════════════════ */}
        <Section label="your stats">

          {loadingStats && (
            <p className="text-muted text-xs tracking-widest opacity-30 animate-pulse py-2">
              fetching stats...
            </p>
          )}

          {!loadingStats && !global && (
            <p className="text-muted text-sm tracking-widest opacity-40 py-2">
              no sessions yet — finish a test first
            </p>
          )}

          {!loadingStats && global && (
            <div className="flex flex-col gap-10">

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="tests taken" value={global.totalSessions} />
                <StatCard label="avg wpm"     value={global.avgWpm} />
                <StatCard label="best wpm"    value={global.topWpm} />
              </div>

              {/* Best language callout */}
              {bestLang && (
                <div
                  className="flex items-center gap-5 px-6 py-4"
                  style={{ border: '1px solid rgba(0,255,65,0.1)', background: 'rgba(0,20,0,0.3)' }}
                >
                  <span className="text-xs tracking-[0.2em] text-muted opacity-40 uppercase select-none whitespace-nowrap">
                    top language
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(0,255,65,0.08)' }} />
                  <span className="text-text glow-text text-sm tracking-widest">{bestLang.language}</span>
                  <span className="text-muted opacity-40 text-xs">·</span>
                  <span className="text-muted text-xs tracking-widest opacity-50">{bestLang.topWpm} wpm peak</span>
                </div>
              )}

              {/* Recent tests table */}
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-5">
                    <span className="text-xs tracking-[0.25em] text-muted opacity-45 uppercase select-none">
                      recent tests
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(0,255,65,0.08)' }} />
                  </div>

                  {/* Column headers */}
                  <div
                    className="grid text-xs tracking-widest text-muted opacity-35 uppercase select-none pb-3 mb-1"
                    style={{
                      gridTemplateColumns: '5rem 4rem 6rem 4rem',
                      borderBottom: '1px solid rgba(0,255,65,0.08)',
                    }}
                  >
                    <span>wpm</span>
                    <span>acc</span>
                    <span>language</span>
                    <span>time</span>
                  </div>

                  <div className="flex flex-col">
                    {recent.map((s, i) => (
                      <div
                        key={s._id ?? i}
                        className="grid text-sm py-3 transition-all"
                        style={{
                          gridTemplateColumns: '5rem 4rem 6rem 4rem',
                          borderBottom: '1px solid rgba(0,255,65,0.05)',
                        }}
                      >
                        <span className="text-text tabular-nums">{s.wpm}</span>
                        <span className="text-muted opacity-70 tabular-nums">{s.accuracy}%</span>
                        <span className="text-muted opacity-50">{s.language}</span>
                        <span className="text-muted opacity-40">{s.duration}s</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </Section>

      </div>
    </div>
  )
}
