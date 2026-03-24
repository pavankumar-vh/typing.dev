import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_URL || ''
const FONT = 'JetBrains Mono, monospace'

/* ─── Helpers ─── */
function fmt(n) { return n == null ? '—' : n }
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function cellBg(n) {
  if (!n) return 'rgba(0,40,0,0.5)'
  if (n === 1) return 'rgba(0,115,0,0.65)'
  if (n <= 3) return 'rgba(0,175,0,0.75)'
  if (n <= 6) return 'rgba(0,225,0,0.85)'
  return '#00FF41'
}

function AvatarCircle({ name, size = 64 }) {
  const ini = name ? name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('') : '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,6,0,0.97)', border: '2.5px solid #00FF41',
      color: '#00FF41', fontSize: size * 0.34, fontWeight: 700, fontFamily: FONT,
      boxShadow: '0 0 20px rgba(0,255,65,0.3), 0 0 40px rgba(0,255,65,0.1)',
      userSelect: 'none', letterSpacing: '0.04em',
    }}>{ini}</div>
  )
}

/* ─── Mini heatmap ─── */
function MiniHeatmap({ sessions }) {
  const CELL = 8, GAP = 2, WEEKS = 26

  const today = useMemo(() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d }, [])
  const countMap = useMemo(() => {
    const m = {}
    sessions.forEach(s => { if (!s.createdAt) return; const k = dateKey(new Date(s.createdAt)); m[k] = (m[k] || 0) + 1 })
    return m
  }, [sessions])

  const grid = useMemo(() => {
    const dow = (today.getDay() + 6) % 7
    const start = new Date(today)
    start.setHours(0, 0, 0, 0)
    start.setDate(today.getDate() - dow - (WEEKS - 1) * 7)
    const cols = []
    for (let w = 0; w < WEEKS; w++) {
      const col = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(start)
        date.setDate(date.getDate() + w * 7 + d)
        const key = dateKey(date)
        col.push({ count: date > today ? -1 : (countMap[key] || 0) })
      }
      cols.push(col)
    }
    return cols
  }, [today, countMap])

  return (
    <div style={{ display: 'flex', gap: GAP, overflow: 'hidden' }}>
      {grid.map((col, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
          {col.map((cell, di) => (
            <div key={di} style={{
              width: CELL, height: CELL, borderRadius: 1.5,
              background: cell.count === -1 ? 'rgba(0,18,0,0.2)' : cellBg(cell.count),
            }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function PublicProfile() {
  const { userId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${API_BASE}/api/sessions/users/${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) throw new Error(d.error || 'Not found')
        setData(d.data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return (
    <div className="page-wrap">
      <div style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(0,204,53,0.3)' }}>loading profile...</div>
    </div>
  )

  if (error) return (
    <div className="page-wrap">
      <div style={{ fontFamily: FONT, fontSize: 14, color: 'rgba(255,88,88,0.6)', marginBottom: 16 }}>
        player not found
      </div>
      <Link to="/players" style={{ fontFamily: FONT, fontSize: 13, color: '#00FF41', textDecoration: 'none' }}>
        ← back to search
      </Link>
    </div>
  )

  const { displayName, global: g, byLanguage, sessions } = data
  const maxWpm = byLanguage.length ? Math.max(...byLanguage.map(l => l.topWpm)) : 1

  return (
    <motion.div
      className="page-wrap"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ fontFamily: FONT }}
    >
      <div style={{ width: '100%', maxWidth: 700 }}>

        {/* Header */}
        <div className="page-header">
          <div className="page-header-prompt">
            <span className="page-header-dot" />
            <span>&gt; player profile</span>
          </div>
          <h1>{displayName}</h1>
          <div className="page-header-divider" />
        </div>

        {/* Hero card */}
        <div className="pub-profile-hero">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
            <AvatarCircle name={displayName} size={72} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#00FF41', textShadow: '0 0 18px rgba(0,255,65,0.5)', lineHeight: 1, marginBottom: 6 }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(0,204,53,0.3)', letterSpacing: '0.1em' }}>
                {g.totalSessions} tests completed
              </div>
            </div>
            <Link to="/players" className="pub-back-link">← search</Link>
          </div>

          {/* Stat strip */}
          <div className="pub-stat-strip">
            {[
              { label: 'best wpm', value: g.topWpm },
              { label: 'avg wpm', value: g.avgWpm },
              { label: 'accuracy', value: g.avgAccuracy != null ? `${g.avgAccuracy}%` : '—' },
              { label: 'tests', value: g.totalSessions },
            ].map(s => (
              <div key={s.label} className="pub-stat-item">
                <div className="pub-stat-value">{fmt(s.value)}</div>
                <div className="pub-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="pub-card">
          <div className="pub-section-label">activity · last 6 months</div>
          <MiniHeatmap sessions={sessions} />
        </div>

        {/* Language breakdown */}
        {byLanguage.length > 0 && (
          <div className="pub-card">
            <div className="pub-section-label">languages</div>
            {[...byLanguage].sort((a, b) => b.topWpm - a.topWpm).map(l => (
              <div key={l.language} className="pub-lang-row">
                <span className="pub-lang-name">{l.language}</span>
                <div className="pub-lang-bar-bg">
                  <div
                    className="pub-lang-bar-fill"
                    style={{ width: `${Math.round((l.topWpm / maxWpm) * 100)}%` }}
                  />
                </div>
                <span className="pub-lang-wpm">{l.topWpm}</span>
                <span className="pub-lang-avg">{l.avgWpm}</span>
                <span className="pub-lang-acc">{l.avgAccuracy}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent tests */}
        <div className="pub-card">
          <div className="pub-section-label">recent tests</div>
          {sessions.slice(0, 15).map((s, i) => (
            <div key={s._id ?? i} className="pub-test-row">
              <span className="pub-test-wpm">{s.wpm}</span>
              <span className="pub-test-acc">{s.accuracy}%</span>
              <span className="pub-test-lang">{s.language}</span>
              <span className="pub-test-dur">{s.duration}s</span>
              <span className="pub-test-date">
                {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>

        {/* Challenge button */}
        <Link to={`/battle?opponent=${userId}`} className="pub-challenge-btn">
          ⚔ challenge {displayName}
        </Link>
        <div className="pub-challenge-hint">
          they'll get a notification · also sends a shareable link
        </div>
      </div>
    </motion.div>
  )
}
