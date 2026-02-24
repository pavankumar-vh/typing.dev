import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { Link } from 'react-router-dom'

const FONT = 'JetBrains Mono, monospace'
const API_BASE = ''
const LANG_ORDER = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++']
const LANG_BADGE = {
  javascript: 'JS', typescript: 'TS', python: 'PY',
  java: 'JV', go: 'GO', rust: 'RS', 'c++': 'C+',
}

function SkeletonRows({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 20px',
          borderBottom: i < count - 1 ? '1px solid rgba(0,60,0,0.18)' : 'none',
          opacity: 1 - i * 0.13,
        }}>
          <div className="lb-skeleton" style={{ width: 36, height: 13, borderRadius: 3 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="lb-skeleton" style={{ width: `${68 - i * 7}%`, height: 11 }} />
            <div className="lb-skeleton" style={{ width: `${88 - i * 5}%`, height: 3 }} />
          </div>
          <div className="lb-skeleton" style={{ width: 40, height: 13, borderRadius: 3 }} />
          <div className="lb-skeleton" style={{ width: 32, height: 13, borderRadius: 3 }} />
        </div>
      ))}
    </div>
  )
}

function StatStrip({ items }) {
  return (
    <div style={{
      display: 'flex', gap: 0,
      borderRadius: 14, overflow: 'hidden',
      border: '1px solid rgba(0,90,0,0.2)',
      background: 'rgba(0,5,0,0.55)',
      marginBottom: 28,
    }}>
      {items.map((item, i) => (
        <div key={item.label} style={{
          flex: 1, padding: '12px 16px', textAlign: 'center',
          borderRight: i < items.length - 1 ? '1px solid rgba(0,70,0,0.25)' : 'none',
        }}>
          <div style={{
            fontFamily: FONT, fontSize: 19, fontWeight: 700, lineHeight: 1,
            color: '#00FF41', textShadow: '0 0 12px rgba(0,255,65,0.5)',
          }}>
            {item.value ?? '—'}
          </div>
          <div style={{
            fontFamily: FONT, fontSize: 9, marginTop: 5,
            color: 'rgba(0,204,53,0.32)', letterSpacing: '0.15em', textTransform: 'uppercase',
          }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}

function LangRow({ lang, topWpm, avgWpm, sessions, maxWpm }) {
  const pct = maxWpm > 0 ? Math.min((topWpm / maxWpm) * 100, 100) : 0
  const badge = LANG_BADGE[lang] ?? lang.toUpperCase().slice(0, 2)
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2.4rem 1fr 3.2rem 3.2rem 2.4rem',
      alignItems: 'center', gap: 12,
      padding: '11px 20px',
      borderBottom: '1px solid rgba(0,50,0,0.2)',
      borderLeft: '2px solid transparent',
    }}>
      <span style={{
        fontFamily: FONT, fontSize: 10, letterSpacing: '0.06em', fontWeight: 700,
        padding: '2px 5px', borderRadius: 3, textAlign: 'center',
        background: 'rgba(0,80,0,0.45)', color: 'rgba(0,204,53,0.5)',
      }}>
        {badge}
      </span>
      <div style={{ height: 3, background: 'rgba(0,255,65,0.07)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          style={{ height: '100%', background: 'rgba(0,204,53,0.4)' }}
        />
      </div>
      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, textAlign: 'right', color: '#00FF41', textShadow: '0 0 6px rgba(0,255,65,0.3)' }}>
        {topWpm}
      </span>
      <span style={{ fontFamily: FONT, fontSize: 12, textAlign: 'right', color: 'rgba(0,204,53,0.5)' }}>
        {avgWpm}
      </span>
      <span style={{ fontFamily: FONT, fontSize: 10, textAlign: 'right', color: 'rgba(0,204,53,0.28)' }}>
        {sessions}
      </span>
    </div>
  )
}

function HistoryRow({ session, timeAgo, idx }) {
  const badge = LANG_BADGE[session.language] ?? session.language?.toUpperCase().slice(0, 2) ?? '??'
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay: idx * 0.025 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '2.4rem 3.5rem 3rem 4rem 2.8rem 1fr',
        alignItems: 'center', gap: 12,
        padding: '11px 20px',
        borderBottom: '1px solid rgba(0,50,0,0.18)',
        borderLeft: '2px solid transparent',
      }}
    >
      <span style={{
        fontFamily: FONT, fontSize: 10, letterSpacing: '0.06em', fontWeight: 700,
        padding: '2px 5px', borderRadius: 3, textAlign: 'center',
        background: 'rgba(0,80,0,0.45)', color: 'rgba(0,204,53,0.5)',
      }}>
        {badge}
      </span>
      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#00FF41', textShadow: '0 0 6px rgba(0,255,65,0.3)', textAlign: 'right' }}>
        {session.wpm}
      </span>
      <span style={{ fontFamily: FONT, fontSize: 11, textAlign: 'right', color: 'rgba(0,204,53,0.38)' }}>
        {session.rawWpm}
      </span>
      <span style={{ fontFamily: FONT, fontSize: 11, textAlign: 'right', color: 'rgba(0,204,53,0.5)' }}>
        {session.accuracy}%
      </span>
      <span style={{ fontFamily: FONT, fontSize: 10, textAlign: 'right', color: 'rgba(0,204,53,0.28)' }}>
        {session.duration}s
      </span>
      <span style={{ fontFamily: FONT, fontSize: 10, textAlign: 'right', color: 'rgba(0,204,53,0.22)', letterSpacing: '0.05em' }}>
        {timeAgo}
      </span>
    </motion.div>
  )
}

export default function MyStats() {
  const { user } = useAuth()
  const [stats, setStats]           = useState(null)
  const [history, setHistory]       = useState([])
  const [rank, setRank]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [langFilter, setLangFilter] = useState('all')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      fetch(`${API_BASE}/api/sessions/stats?userId=${user.uid}`).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() }).catch(() => null),
      fetch(`${API_BASE}/api/sessions?userId=${user.uid}&limit=30&sort=newest`).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() }).catch(() => null),
      fetch(`${API_BASE}/api/sessions/leaderboard/users`).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() }).catch(() => null),
    ]).then(([statsRes, histRes, lbRes]) => {
      if (statsRes?.success) setStats(statsRes.data)
      if (histRes?.success)  setHistory(histRes.data ?? [])
      if (lbRes?.success) {
        const idx = lbRes.data.findIndex(e => e.userId === user.uid)
        setRank(idx >= 0 ? idx + 1 : null)
      }
    }).finally(() => setLoading(false))
  }, [user])

  const global     = stats?.global
  const byLang     = stats?.byLanguage ?? []
  const langMap    = Object.fromEntries(byLang.map(s => [s.language, s]))
  const availLangs = [
    ...LANG_ORDER.filter(l => langMap[l]),
    ...byLang.filter(s => !LANG_ORDER.includes(s.language)).map(s => s.language),
  ]
  const maxWpm = Math.max(1, ...byLang.map(s => s.topWpm))
  const langCounts = Object.fromEntries(
    ['all', ...LANG_ORDER].map(l => [l, l === 'all' ? history.length : history.filter(s => s.language === l).length])
  )
  const displayed = langFilter === 'all' ? history : history.filter(s => s.language === langFilter)

  function ago(iso) {
    const d = Math.floor((Date.now() - new Date(iso)) / 1000)
    if (d < 60)    return `${d}s ago`
    if (d < 3600)  return `${Math.floor(d / 60)}m ago`
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`
    return `${Math.floor(d / 86400)}d ago`
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || null

  if (!user) return (
    <div style={{
      minHeight: 'calc(100vh - 53px)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(0,204,53,0.35)', letterSpacing: '0.2em' }}>
        &gt; sign in to view your stats
      </div>
      <Link to="/login" style={{
        fontFamily: FONT, fontSize: 11, letterSpacing: '0.2em',
        color: '#00FF41', textDecoration: 'none', textShadow: '0 0 10px rgba(0,255,65,0.4)',
      }}>
        &gt; login
      </Link>
    </div>
  )

  return (
    <motion.div
      className="min-h-[calc(100vh-53px)] flex flex-col items-center px-5 pt-10 pb-24"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{ width: '100%', maxWidth: 640 }}>

        {/* header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: FONT, fontSize: 11, letterSpacing: '0.34em',
            color: 'rgba(0,204,53,0.32)', textTransform: 'uppercase', marginBottom: 6,
          }}>
            &gt;&nbsp; my stats
          </div>
          <h1 style={{
            fontFamily: FONT, fontSize: 22, fontWeight: 700, margin: 0,
            color: '#00FF41',
            textShadow: '0 0 20px rgba(0,255,65,0.55), 0 0 40px rgba(0,255,65,0.2)',
            letterSpacing: '0.03em', lineHeight: 1,
          }}>
            {displayName ?? 'your stats'}
          </h1>
        </div>

        {/* loading */}
        {loading && (
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,80,0,0.17)', background: 'rgba(0,5,0,0.5)' }}>
            <SkeletonRows count={7} />
          </div>
        )}

        {/* empty */}
        {!loading && (!global || global.totalSessions === 0) && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(0,204,53,0.22)', letterSpacing: '0.2em' }}>
              no sessions yet — complete a test to see your stats
            </div>
          </div>
        )}

        {/* content */}
        {!loading && global && global.totalSessions > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>

            {/* hero strip */}
            <StatStrip items={[
              { label: 'rank',     value: rank ? `#${rank}` : '—' },
              { label: 'tests',    value: global.totalSessions },
              { label: 'best wpm', value: global.topWpm },
              { label: 'avg wpm',  value: global.avgWpm },
              { label: 'accuracy', value: global.avgAccuracy ? `${global.avgAccuracy}%` : '—' },
            ]} />

            {/* by language */}
            {availLangs.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  fontFamily: FONT, fontSize: 9, letterSpacing: '0.28em',
                  color: 'rgba(0,204,53,0.22)', textTransform: 'uppercase', marginBottom: 14,
                }}>
                  by language
                </div>
                <div style={{
                  borderRadius: 16, overflow: 'hidden',
                  border: '1px solid rgba(0,88,0,0.18)', background: 'rgba(0,5,0,0.5)',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2.4rem 1fr 3.2rem 3.2rem 2.4rem',
                    gap: 12, padding: '10px 20px',
                    borderBottom: '1px solid rgba(0,60,0,0.22)',
                    fontFamily: FONT, fontSize: 9,
                    letterSpacing: '0.15em', color: 'rgba(0,204,53,0.22)', textTransform: 'uppercase',
                  }}>
                    <span>lang</span>
                    <span>best wpm</span>
                    <span style={{ textAlign: 'right' }}>best</span>
                    <span style={{ textAlign: 'right' }}>avg</span>
                    <span style={{ textAlign: 'right' }}>n</span>
                  </div>
                  {availLangs.map(l => (
                    <LangRow
                      key={l} lang={l}
                      topWpm={langMap[l]?.topWpm ?? 0}
                      avgWpm={langMap[l]?.avgWpm ?? 0}
                      sessions={langMap[l]?.totalSessions ?? 0}
                      maxWpm={maxWpm}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* recent tests */}
            <div>
              <div style={{
                fontFamily: FONT, fontSize: 9, letterSpacing: '0.28em',
                color: 'rgba(0,204,53,0.22)', textTransform: 'uppercase', marginBottom: 14,
              }}>
                recent tests
              </div>

              {/* filter pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {['all', ...LANG_ORDER].map(l => {
                  const on    = langFilter === l
                  const count = langCounts[l] ?? 0
                  if (l !== 'all' && count === 0) return null
                  const badge = l === 'all' ? 'ALL' : (LANG_BADGE[l] ?? l)
                  return (
                    <button
                      key={l}
                      onClick={() => setLangFilter(l)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 11px 5px 7px', borderRadius: 8,
                        border: on ? '1px solid rgba(0,255,65,0.24)' : '1px solid rgba(0,88,0,0.2)',
                        color: on ? '#00FF41' : 'rgba(0,204,53,0.42)',
                        background: on ? 'rgba(0,255,65,0.08)' : 'rgba(0,5,0,0.5)',
                        fontFamily: FONT, fontSize: 11, letterSpacing: '0.06em',
                        textShadow: on ? '0 0 8px rgba(0,255,65,0.45)' : 'none',
                        transition: 'all 0.14s', cursor: 'pointer',
                      }}
                    >
                      <span style={{
                        fontSize: 9, padding: '1px 4px', borderRadius: 3, fontWeight: 700,
                        letterSpacing: '0.05em',
                        background: on ? 'rgba(0,255,65,0.17)' : 'rgba(0,80,0,0.45)',
                        color: on ? '#00FF41' : 'rgba(0,204,53,0.5)',
                      }}>
                        {badge}
                      </span>
                      {l === 'all' ? 'all' : l}
                      <span style={{ fontSize: 9, marginLeft: 2, color: on ? 'rgba(0,255,65,0.5)' : 'rgba(0,204,53,0.28)' }}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* history list */}
              {displayed.length === 0 ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', fontFamily: FONT, fontSize: 11, color: 'rgba(0,204,53,0.22)', letterSpacing: '0.15em' }}>
                  no sessions for this filter
                </div>
              ) : (
                <div style={{
                  borderRadius: 16, overflow: 'hidden',
                  border: '1px solid rgba(0,88,0,0.18)', background: 'rgba(0,5,0,0.5)',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2.4rem 3.5rem 3rem 4rem 2.8rem 1fr',
                    gap: 12, padding: '10px 20px',
                    borderBottom: '1px solid rgba(0,60,0,0.22)',
                    fontFamily: FONT, fontSize: 9,
                    letterSpacing: '0.15em', color: 'rgba(0,204,53,0.22)', textTransform: 'uppercase',
                  }}>
                    <span>lang</span>
                    <span style={{ textAlign: 'right' }}>wpm</span>
                    <span style={{ textAlign: 'right' }}>raw</span>
                    <span style={{ textAlign: 'right' }}>acc</span>
                    <span style={{ textAlign: 'right' }}>dur</span>
                    <span style={{ textAlign: 'right' }}>when</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={langFilter}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {displayed.map((s, i) => (
                        <HistoryRow key={s._id ?? i} session={s} timeAgo={ago(s.createdAt)} idx={i} />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>

          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

