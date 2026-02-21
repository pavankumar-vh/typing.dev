import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="text-xs tracking-[0.25em] text-muted opacity-50 uppercase select-none whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(0,255,65,0.1)' }} />
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-3 px-6 py-5" style={{ border: '1px solid rgba(0,255,65,0.1)', background: 'rgba(0,20,0,0.3)' }}>
      <span className="text-xs tracking-[0.2em] text-muted opacity-50 uppercase select-none">{label}</span>
      <span className="text-4xl glow-text text-text tabular-nums leading-none">{value}</span>
      {sub && <span className="text-xs text-muted opacity-40 tracking-widest">{sub}</span>}
    </div>
  )
}

export default function MyStats() {
  const { user } = useAuth()
  const [stats, setStats]         = useState(null)
  const [history, setHistory]     = useState([])
  const [rank, setRank]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [langFilter, setLangFilter] = useState('all')

  useEffect(() => {
    if (!user) { setLoading(false); return }

    Promise.all([
      fetch(`${API_BASE}/api/sessions/stats?userId=${user.uid}`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/api/sessions?userId=${user.uid}&limit=20&sort=newest`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/api/sessions/leaderboard/users`).then(r => r.json()).catch(() => null),
    ]).then(([statsRes, histRes, lbRes]) => {
      if (statsRes?.success)  setStats(statsRes.data)
      if (histRes?.success)   setHistory(histRes.data)
      if (lbRes?.success) {
        const idx = lbRes.data.findIndex(e => e.userId === user.uid)
        setRank(idx >= 0 ? idx + 1 : null)
      }
    }).finally(() => setLoading(false))
  }, [user])

  const langs     = ['javascript', 'python', 'java']
  const displayed = langFilter === 'all' ? history : history.filter(s => s.language === langFilter)
  const global    = stats?.global
  const byLang    = stats?.byLanguage ?? []

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)   return 'just now'
    if (m < 60)  return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24)  return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  if (!user) return (
    <div className="min-h-[calc(100vh-53px)] flex flex-col items-center justify-center gap-6">
      <p className="text-muted tracking-widest opacity-60 text-sm">&gt; login to view your personal stats</p>
      <Link to="/login" className="text-xs tracking-widest text-text glow-text hover:opacity-80">&gt; login</Link>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-53px)] flex flex-col items-center px-8 pt-14 pb-28">
      <div className="w-full max-w-2xl">

        <p className="text-xs tracking-[0.3em] text-muted opacity-40 mb-14 select-none uppercase">
          &gt;&nbsp; my stats
        </p>

        {loading && (
          <p className="text-muted text-xs tracking-widest opacity-30 animate-pulse">loading your data...</p>
        )}

        {!loading && (
          <>
            {/* ── Overview cards ─────────────────────────── */}
            <div className="mb-12">
              <SectionHeader>overview</SectionHeader>
              {!global || global.totalSessions === 0 ? (
                <p className="text-muted text-sm opacity-40 tracking-widest">no sessions yet — finish a test first</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <StatCard label="global rank"  value={rank ? `#${rank}` : '—'}  sub="by best wpm" />
                  <StatCard label="tests taken"  value={global.totalSessions} />
                  <StatCard label="best wpm"     value={global.topWpm} />
                  <StatCard label="avg wpm"      value={global.avgWpm} />
                </div>
              )}
            </div>

            {/* ── Per-language breakdown ─────────────────── */}
            {byLang.length > 0 && (
              <div className="mb-12">
                <SectionHeader>by language</SectionHeader>
                <div className="flex flex-col">
                  {/* column headers */}
                  <div
                    className="grid text-xs tracking-widest text-muted opacity-35 uppercase pb-3 mb-1 select-none"
                    style={{ gridTemplateColumns: '7rem 5rem 5rem 5rem 5rem', borderBottom: '1px solid rgba(0,255,65,0.08)' }}
                  >
                    <span>language</span>
                    <span>best</span>
                    <span>avg</span>
                    <span>acc%</span>
                    <span>tests</span>
                  </div>
                  {byLang.map((l) => (
                    <div
                      key={l.language}
                      className="grid text-sm py-3"
                      style={{ gridTemplateColumns: '7rem 5rem 5rem 5rem 5rem', borderBottom: '1px solid rgba(0,255,65,0.05)' }}
                    >
                      <span className="text-text glow-text">{l.language}</span>
                      <span className="text-text tabular-nums">{l.topWpm}</span>
                      <span className="text-muted opacity-70 tabular-nums">{l.avgWpm}</span>
                      <span className="text-muted opacity-60 tabular-nums">{l.avgAccuracy}%</span>
                      <span className="text-muted opacity-40 tabular-nums">{l.totalSessions}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Recent history ─────────────────────────── */}
            <div>
              <SectionHeader>recent tests</SectionHeader>

              {/* language filter */}
              <div className="flex gap-1 mb-6">
                {['all', ...langs].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLangFilter(l)}
                    className={`px-3 py-1.5 text-xs tracking-widest transition-all ${
                      langFilter === l
                        ? 'text-text glow-text border-b'
                        : 'text-muted opacity-40 hover:opacity-80 hover:text-text'
                    }`}
                    style={langFilter === l ? { borderColor: 'rgba(0,255,65,0.5)' } : {}}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {displayed.length === 0 ? (
                <p className="text-muted text-sm opacity-40 tracking-widest">no sessions for this filter</p>
              ) : (
                <>
                  <div
                    className="grid text-xs tracking-widest text-muted opacity-35 uppercase pb-3 mb-1 select-none"
                    style={{ gridTemplateColumns: '5rem 5rem 6rem 4rem 5rem', borderBottom: '1px solid rgba(0,255,65,0.08)' }}
                  >
                    <span>wpm</span>
                    <span>raw</span>
                    <span>accuracy</span>
                    <span>time</span>
                    <span>when</span>
                  </div>
                  <div className="flex flex-col">
                    {displayed.map((s, i) => (
                      <div
                        key={s._id ?? i}
                        className="grid text-sm py-3"
                        style={{ gridTemplateColumns: '5rem 5rem 6rem 4rem 5rem', borderBottom: '1px solid rgba(0,255,65,0.05)' }}
                      >
                        <span className="text-text tabular-nums">{s.wpm}</span>
                        <span className="text-muted opacity-60 tabular-nums">{s.rawWpm}</span>
                        <span className="text-muted opacity-60 tabular-nums">{s.accuracy}%</span>
                        <span className="text-muted opacity-40">{s.duration}s</span>
                        <span className="text-muted opacity-30 text-xs">{timeAgo(s.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
