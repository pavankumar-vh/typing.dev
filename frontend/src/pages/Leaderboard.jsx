import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = ''

const LANGS = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++']
const LANG_BADGE = {
  javascript: 'JS', typescript: 'TS', python: 'PY',
  java: 'JV', go: 'GO', rust: 'RS', 'c++': 'C+',
}
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']
const RANK_GLOW = [
  '0 0 20px rgba(255,215,0,0.55)',
  '0 0 14px rgba(192,192,192,0.45)',
  '0 0 12px rgba(205,127,50,0.45)',
]
const RANK_BG = [
  'rgba(255,215,0,0.06)',
  'rgba(192,192,192,0.04)',
  'rgba(205,127,50,0.04)',
]

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)    return diff + 's'
  if (diff < 3600)  return Math.floor(diff / 60) + 'm'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h'
  return Math.floor(diff / 86400) + 'd'
}

function initials(name) {
  if (!name || name === 'anon') return '?'
  return name.trim().charAt(0).toUpperCase()
}

function Avatar({ name, rank, size = 36 }) {
  const isPodium = rank <= 3
  const color  = isPodium ? RANK_COLORS[rank - 1] : '#00CC35'
  const shadow = isPodium ? RANK_GLOW[rank - 1]   : 'none'
  const rgb    = isPodium
    ? (rank === 1 ? '255,215,0' : rank === 2 ? '192,192,192' : '205,127,50')
    : '0,204,53'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.42), fontWeight: 700,
      fontFamily: 'JetBrains Mono, monospace',
      color, textShadow: shadow,
      background: `rgba(${rgb}, 0.10)`,
      border: `1.5px solid ${color}33`,
      boxShadow: isPodium ? `inset 0 0 12px ${color}18` : 'none',
    }}>
      {initials(name)}
    </div>
  )
}

function CrownIcon() {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none"
      style={{ filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.7))' }}>
      <path d="M1 13h18M2 13L1 5l4.5 3.5L10 1l4.5 7.5L19 5l-1 8H2z"
        stroke="#FFD700" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function WpmBar({ wpm, maxWpm, rank, height = 3 }) {
  const pct    = maxWpm > 0 ? Math.min((wpm / maxWpm) * 100, 100) : 0
  const isPodium = rank <= 3
  const color  = isPodium ? RANK_COLORS[rank - 1] : 'rgba(0,255,65,0.55)'
  const glow   = isPodium ? RANK_GLOW[rank - 1]   : 'none'
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{
        flex: 1, height, minWidth: 32, borderRadius: height,
        background: 'rgba(0,255,65,0.07)', overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          style={{ height: '100%', borderRadius: height, background: color, boxShadow: glow }}
        />
      </div>
    </div>
  )
}

function PodiumCard({ row, rank, maxWpm, isMe }) {
  const color     = RANK_COLORS[rank - 1]
  const glow      = RANK_GLOW[rank - 1]
  const bg        = RANK_BG[rank - 1]
  const cardW     = rank === 1 ? 188 : 160
  const cardH     = rank === 1 ? 210 : rank === 2 ? 182 : 168
  const delay     = [0.08, 0.04, 0.12][rank - 1]
  const wpm       = (row?.wpm ?? row?.topWpm) || 0
  const acc       = row?.accuracy ?? row?.avgAccuracy
  const name      = row?.displayName || 'anon'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay }}
      style={{
        width: cardW, minHeight: cardH, borderRadius: 16,
        padding: '20px 14px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9,
        background: bg,
        border: `1px solid ${color}2A`,
        boxShadow: `0 0 28px ${color}10, inset 0 0 28px ${color}05`,
        position: 'relative',
        marginBottom: rank === 1 ? 0 : rank === 2 ? 16 : 32,
      }}
    >
      {/* Medal */}
      <div style={{
        position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30,
      }}>
        {rank === 1 ? <CrownIcon /> : (
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: bg, border: `1.5px solid ${color}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color, textShadow: glow,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {rank}
          </div>
        )}
      </div>

      <Avatar name={name} rank={rank} size={rank === 1 ? 46 : 38} />

      <div style={{ textAlign: 'center', maxWidth: '100%', paddingLeft: 4, paddingRight: 4 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: rank === 1 ? 13 : 11, fontWeight: 600,
          color: isMe ? '#00FF41' : color,
          textShadow: isMe ? '0 0 10px rgba(0,255,65,0.6)' : glow,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}>
          {name}
        </div>
        {isMe && (
          <div style={{ fontSize: 9, color: 'rgba(0,255,65,0.4)', letterSpacing: '0.2em', marginTop: 1, fontFamily: 'JetBrains Mono' }}>
            YOU
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <span style={{
          display: 'block',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: rank === 1 ? 32 : 24, fontWeight: 700,
          color, textShadow: glow, lineHeight: 1,
        }}>
          {wpm}
        </span>
        <span style={{ fontSize: 9, color: 'rgba(0,204,53,0.35)', letterSpacing: '0.2em', fontFamily: 'JetBrains Mono' }}>
          WPM
        </span>
      </div>

      {acc !== undefined && (
        <div style={{
          fontSize: 10, padding: '2px 9px', borderRadius: 20,
          fontFamily: 'JetBrains Mono',
          background: 'rgba(0,255,65,0.07)', border: '1px solid rgba(0,255,65,0.14)',
          color: acc >= 95 ? '#00FF41' : 'rgba(0,204,53,0.55)',
        }}>
          {acc}% acc
        </div>
      )}

      <div style={{ width: '100%', marginTop: 2 }}>
        <WpmBar wpm={wpm} maxWpm={maxWpm} rank={rank} height={4} />
      </div>
    </motion.div>
  )
}

function SkeletonRows({ count = 6 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px',
          borderBottom: i < count - 1 ? '1px solid rgba(0,60,0,0.18)' : 'none',
          opacity: 1 - i * 0.1,
        }}>
          <div className="lb-skeleton" style={{ width: 20, height: 14 }} />
          <div className="lb-skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="lb-skeleton" style={{ width: `${68 - i * 8}%`, height: 12 }} />
            <div className="lb-skeleton" style={{ width: `${90 - i * 5}%`, height: 3 }} />
          </div>
          <div className="lb-skeleton" style={{ width: 38, height: 14, borderRadius: 4 }} />
          <div className="lb-skeleton" style={{ width: 32, height: 14, borderRadius: 4 }} />
        </div>
      ))}
    </div>
  )
}

function RankRow({ row, rank, maxWpm, isMe, isLast, wpmKey, accKey, timeKey }) {
  const wpm  = row?.[wpmKey] || 0
  const acc  = row?.[accKey]
  const ts   = timeKey && row?.[timeKey]

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: (rank - 4) * 0.03 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '2rem 2.4rem 1fr auto auto',
        alignItems: 'center', gap: 12,
        padding: '12px 20px',
        borderBottom: isLast ? 'none' : '1px solid rgba(0,50,0,0.22)',
        background: isMe ? 'rgba(0,255,65,0.03)' : 'transparent',
        borderLeft: isMe ? '2px solid rgba(0,255,65,0.45)' : '2px solid transparent',
        transition: 'background 0.15s',
      }}
    >
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(0,204,53,0.25)', textAlign: 'right' }}>
        {rank}
      </span>

      <Avatar name={row?.displayName || 'anon'} rank={rank} size={30} />

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
            color: isMe ? '#00FF41' : 'rgba(0,204,53,0.7)',
            textShadow: isMe ? '0 0 8px rgba(0,255,65,0.4)' : 'none',
            fontWeight: isMe ? 600 : 400,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200,
          }}>
            {row?.displayName || 'anon'}
          </span>
          {isMe && (
            <span style={{ fontSize: 9, color: 'rgba(0,255,65,0.35)', letterSpacing: '0.2em', flexShrink: 0, fontFamily: 'JetBrains Mono' }}>
              YOU
            </span>
          )}
        </div>
        <WpmBar wpm={wpm} maxWpm={maxWpm} rank={rank} height={3} />
      </div>

      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, minWidth: 52 }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600,
          color: '#00FF41', textShadow: '0 0 6px rgba(0,255,65,0.3)',
        }}>
          {wpm}<span style={{ fontSize: 9, color: 'rgba(0,204,53,0.3)', fontWeight: 400, marginLeft: 3 }}>wpm</span>
        </span>
        {acc !== undefined && (
          <span style={{
            fontSize: 11, fontFamily: 'JetBrains Mono',
            color: acc >= 95 ? 'rgba(0,255,65,0.65)' : acc >= 80 ? 'rgba(0,204,53,0.45)' : '#FF4444',
          }}>
            {acc}%
          </span>
        )}
      </div>

      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(0,204,53,0.20)', minWidth: 24, textAlign: 'right' }}>
        {ts ? timeAgo(ts) : ''}
      </span>
    </motion.div>
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
            fontFamily: 'JetBrains Mono, monospace', fontSize: 19, fontWeight: 700,
            color: '#00FF41', textShadow: '0 0 12px rgba(0,255,65,0.5)', lineHeight: 1,
          }}>
            {item.value ?? '—'}
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
            color: 'rgba(0,204,53,0.32)', letterSpacing: '0.15em', marginTop: 5,
            textTransform: 'uppercase',
          }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Leaderboard() {
  const { user } = useAuth()
  const [mode,     setMode]     = useState('lang')
  const [lang,     setLang]     = useState('javascript')
  const [langData, setLangData] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`${API_BASE}/api/sessions/leaderboard`).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() }),
      fetch(`${API_BASE}/api/sessions/leaderboard/users`).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() }),
    ])
      .then(([lbRes, usersRes]) => {
        if (lbRes.success) {
          const map = {}
          lbRes.data.forEach(({ language, entries }) => { map[language] = entries })
          setLangData(map)
        }
        if (usersRes.success) setUserData(usersRes.data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const langRows   = langData?.[lang]       ?? []
  const userRows   = userData               ?? []
  const maxLangWpm = langRows[0]?.wpm       ?? 1
  const maxUserWpm = userRows[0]?.topWpm    ?? 1
  const langPodium = langRows.slice(0, 3)
  const langTail   = langRows.slice(3)
  const userPodium = userRows.slice(0, 3)
  const userTail   = userRows.slice(3)

  const langStats = [
    { label: 'players',  value: langRows.length },
    { label: 'best wpm', value: langRows[0]?.wpm ?? '—' },
    { label: 'top acc',  value: langRows[0]?.accuracy  != null ? `${langRows[0].accuracy}%`  : '—' },
  ]
  const userStats = [
    { label: 'total',    value: userRows.length },
    { label: 'best wpm', value: userRows[0]?.topWpm ?? '—' },
    { label: 'avg acc',  value: userRows[0]?.avgAccuracy != null ? `${userRows[0].avgAccuracy}%` : '—' },
  ]

  return (
    <motion.div
      className="min-h-[calc(100vh-53px)] flex flex-col items-center px-5 pt-10 pb-24"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full max-w-2xl">

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, letterSpacing: '0.34em',
              color: 'rgba(0,204,53,0.32)',
              textTransform: 'uppercase', marginBottom: 6,
            }}>
              &gt;&nbsp; leaderboard
            </div>
            <h1 style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 22, fontWeight: 700, margin: 0,
              color: '#00FF41',
              textShadow: '0 0 20px rgba(0,255,65,0.55), 0 0 40px rgba(0,255,65,0.2)',
              letterSpacing: '0.03em', lineHeight: 1,
            }}>
              top typists
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
            <button onClick={load} title="Refresh" style={{
              background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,100,0,0.22)',
              borderRadius: 8, padding: '7px 10px',
              color: 'rgba(0,204,53,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </svg>
            </button>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,215,0,0.48)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.3))' }}
            >
              <path d="M6 9H4a2 2 0 0 1-2-2V5h4"/>
              <path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/>
              <path d="M6 9c0 4 2.5 7 6 8 3.5-1 6-4 6-8V3H6z"/>
              <path d="M10 21h4"/><path d="M8 21h8"/><path d="M12 17v4"/>
            </svg>
          </div>
        </div>

        {/* ── Mode tabs ── */}
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          borderRadius: 40, padding: 4, marginBottom: 24,
          background: 'rgba(0,8,0,0.85)', border: '1px solid rgba(0,88,0,0.25)',
        }}>
          {[
            { id: 'lang',  label: 'by language' },
            { id: 'users', label: 'all users'   },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setMode(id)} style={{
              padding: '7px 20px', borderRadius: 36,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, letterSpacing: '0.12em',
              border: 'none', outline: 'none', transition: 'all 0.18s',
              color:      mode === id ? '#00FF41'             : 'rgba(0,204,53,0.38)',
              background: mode === id ? 'rgba(0,255,65,0.10)' : 'transparent',
              textShadow: mode === id ? '0 0 10px rgba(0,255,65,0.6)' : 'none',
              boxShadow:  mode === id ? 'inset 0 0 0 1px rgba(0,255,65,0.18)' : 'none',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            borderRadius: 14, padding: '16px 20px', marginBottom: 20,
            background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)',
          }}>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#FF4444', marginBottom: 4 }}>connection error</p>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(255,68,68,0.5)' }}>{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── By Language ── */}
          {mode === 'lang' && (
            <motion.div key="lang"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {/* Language pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                {LANGS.map(l => {
                  const active = lang === l
                  return (
                    <button key={l} onClick={() => setLang(l)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '5px 11px 5px 7px', borderRadius: 8,
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                      border: active ? '1px solid rgba(0,255,65,0.24)' : '1px solid rgba(0,88,0,0.2)',
                      color:      active ? '#00FF41'             : 'rgba(0,204,53,0.42)',
                      background: active ? 'rgba(0,255,65,0.08)' : 'rgba(0,5,0,0.5)',
                      textShadow: active ? '0 0 8px rgba(0,255,65,0.45)' : 'none',
                      boxShadow:  active ? '0 0 12px rgba(0,255,65,0.07)' : 'none',
                      transition: 'all 0.14s',
                    }}>
                      <span style={{
                        fontSize: 9, padding: '1px 4px', borderRadius: 3, fontWeight: 700,
                        letterSpacing: '0.05em',
                        background: active ? 'rgba(0,255,65,0.17)' : 'rgba(0,80,0,0.45)',
                        color: active ? '#00FF41' : 'rgba(0,204,53,0.5)',
                      }}>
                        {LANG_BADGE[l]}
                      </span>
                      {l}
                    </button>
                  )
                })}
              </div>

              {loading && (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,80,0,0.17)', background: 'rgba(0,5,0,0.5)' }}>
                  <SkeletonRows count={6} />
                </div>
              )}

              {!loading && !error && langRows.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(0,204,53,0.22)', letterSpacing: '0.2em' }}>
                    no sessions yet — complete a test to appear here
                  </div>
                </div>
              )}

              {!loading && !error && langRows.length > 0 && (
                <>
                  <StatStrip items={langStats} />

                  {langPodium.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, marginBottom: 28 }}>
                      {[
                        langPodium[1] ? { row: langPodium[1], rank: 2 } : null,
                        langPodium[0] ? { row: langPodium[0], rank: 1 } : null,
                        langPodium[2] ? { row: langPodium[2], rank: 3 } : null,
                      ].filter(Boolean).map(({ row, rank }) => (
                        <PodiumCard key={rank} row={row} rank={rank}
                          maxWpm={maxLangWpm}
                          isMe={!!(user && row.userId === user.uid)}
                        />
                      ))}
                    </div>
                  )}

                  {langTail.length > 0 && (
                    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,88,0,0.18)', background: 'rgba(0,5,0,0.5)' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2rem 2.4rem 1fr auto auto',
                        gap: 12, padding: '10px 20px',
                        borderBottom: '1px solid rgba(0,60,0,0.22)',
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                        letterSpacing: '0.15em', color: 'rgba(0,204,53,0.22)',
                        textTransform: 'uppercase',
                      }}>
                        <span>#</span><span /><span>player</span>
                        <span style={{ textAlign: 'right' }}>wpm / acc</span>
                        <span style={{ textAlign: 'right', minWidth: 24 }}>age</span>
                      </div>
                      {langTail.map((row, i) => (
                        <RankRow key={row._id ?? i} row={row} rank={i + 4}
                          maxWpm={maxLangWpm}
                          isMe={!!(user && row.userId === user.uid)}
                          isLast={i === langTail.length - 1}
                          wpmKey="wpm" accKey="accuracy" timeKey="createdAt"
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ── All Users ── */}
          {mode === 'users' && (
            <motion.div key="users"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {loading && (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,80,0,0.17)', background: 'rgba(0,5,0,0.5)' }}>
                  <SkeletonRows count={6} />
                </div>
              )}

              {!loading && !error && userRows.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(0,204,53,0.22)', letterSpacing: '0.2em' }}>
                    no users yet — sign up and complete a test
                  </div>
                </div>
              )}

              {!loading && !error && userRows.length > 0 && (
                <>
                  <StatStrip items={userStats} />

                  {userPodium.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, marginBottom: 28 }}>
                      {[
                        userPodium[1] ? { row: userPodium[1], rank: 2 } : null,
                        userPodium[0] ? { row: userPodium[0], rank: 1 } : null,
                        userPodium[2] ? { row: userPodium[2], rank: 3 } : null,
                      ].filter(Boolean).map(({ row, rank }) => (
                        <PodiumCard key={rank} row={row} rank={rank}
                          maxWpm={maxUserWpm}
                          isMe={!!(user && row.userId === user.uid)}
                        />
                      ))}
                    </div>
                  )}

                  {userTail.length > 0 && (
                    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,88,0,0.18)', background: 'rgba(0,5,0,0.5)' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2rem 2.4rem 1fr auto auto',
                        gap: 12, padding: '10px 20px',
                        borderBottom: '1px solid rgba(0,60,0,0.22)',
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                        letterSpacing: '0.15em', color: 'rgba(0,204,53,0.22)',
                        textTransform: 'uppercase',
                      }}>
                        <span>#</span><span /><span>player</span>
                        <span style={{ textAlign: 'right' }}>best / acc</span>
                        <span style={{ textAlign: 'right', minWidth: 24 }}>tests</span>
                      </div>
                      {userTail.map((row, i) => (
                        <RankRow key={row.userId ?? i} row={row} rank={i + 4}
                          maxWpm={maxUserWpm}
                          isMe={!!(user && row.userId === user.uid)}
                          isLast={i === userTail.length - 1}
                          wpmKey="topWpm" accKey="avgAccuracy" timeKey={null}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}
