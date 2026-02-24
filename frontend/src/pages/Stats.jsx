import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Shared helpers (mirrors Leaderboard design tokens) ────
const FONT = 'JetBrains Mono, monospace'

function SkeletonRows({ count = 4 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px',
          borderBottom: i < count - 1 ? '1px solid rgba(0,60,0,0.18)' : 'none',
          opacity: 1 - i * 0.12,
        }}>
          <div className="lb-skeleton" style={{ width: 40, height: 14, borderRadius: 4 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="lb-skeleton" style={{ width: `${70 - i * 8}%`, height: 12 }} />
            <div className="lb-skeleton" style={{ width: `${90 - i * 6}%`, height: 3 }} />
          </div>
          <div className="lb-skeleton" style={{ width: 44, height: 14, borderRadius: 4 }} />
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
            fontFamily: FONT, fontSize: 19, fontWeight: 700,
            color: '#00FF41', textShadow: '0 0 12px rgba(0,255,65,0.5)', lineHeight: 1,
          }}>
            {item.value ?? '—'}
          </div>
          <div style={{
            fontFamily: FONT, fontSize: 9,
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

function WpmBar({ value, max, label, badge, active, onClick }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <button
      onClick={onClick}
      style={{
        display: 'grid', gridTemplateColumns: '2.4rem 1fr 3rem',
        alignItems: 'center', gap: 12,
        padding: '11px 20px', width: '100%', textAlign: 'left',
        borderBottom: '1px solid rgba(0,50,0,0.2)',
        background: active ? 'rgba(0,255,65,0.03)' : 'transparent',
        borderLeft: active ? '2px solid rgba(0,255,65,0.45)' : '2px solid transparent',
        transition: 'background 0.15s',
      }}
    >
      <span style={{
        fontFamily: FONT, fontSize: 10, letterSpacing: '0.06em', fontWeight: 700,
        padding: '2px 5px', borderRadius: 3,
        background: active ? 'rgba(0,255,65,0.17)' : 'rgba(0,80,0,0.45)',
        color: active ? '#00FF41' : 'rgba(0,204,53,0.5)',
        textAlign: 'center',
      }}>
        {badge}
      </span>
      <div style={{ flex: 1, height: 3, background: 'rgba(0,255,65,0.07)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          style={{ height: '100%', background: active ? 'rgba(0,255,65,0.65)' : 'rgba(0,204,53,0.28)' }}
        />
      </div>
      <span style={{
        fontFamily: FONT, fontSize: 13, fontWeight: active ? 600 : 400,
        color: active ? '#00FF41' : 'rgba(0,204,53,0.5)',
        textShadow: active ? '0 0 6px rgba(0,255,65,0.3)' : 'none',
        textAlign: 'right',
      }}>
        {value}
      </span>
    </button>
  )
}

function LangDetailPanel({ stat }) {
  const items = [
    { label: 'best wpm',  value: stat.topWpm },
    { label: 'avg wpm',   value: stat.avgWpm },
    { label: 'accuracy',  value: `${stat.avgAccuracy}%` },
    { label: 'raw wpm',   value: stat.avgRawWpm },
    { label: 'errors',    value: stat.avgErrors },
    { label: 'sessions',  value: stat.totalSessions },
  ]
  return (
    <motion.div
      key={stat.language}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.18 }}
      style={{
        borderRadius: 16, overflow: 'hidden',
        border: '1px solid rgba(0,88,0,0.18)',
        background: 'rgba(0,5,0,0.5)',
      }}
    >
      {/* header row */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid rgba(0,60,0,0.22)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          padding: '2px 6px', borderRadius: 3,
          background: 'rgba(0,255,65,0.15)', color: '#00FF41',
        }}>
          {LANG_BADGE[stat.language] ?? stat.language}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(0,204,53,0.5)', letterSpacing: '0.05em' }}>
          {stat.language}
        </span>
      </div>
      {/* stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {items.map((item, i) => (
          <div key={item.label} style={{
            padding: '18px 20px',
            borderRight: i % 3 < 2 ? '1px solid rgba(0,60,0,0.18)' : 'none',
            borderBottom: i < 3 ? '1px solid rgba(0,60,0,0.18)' : 'none',
          }}>
            <div style={{
              fontFamily: FONT, fontSize: i < 2 ? 26 : 18, fontWeight: 700, lineHeight: 1,
              color: i === 0 ? '#00FF41' : 'rgba(0,204,53,0.65)',
              textShadow: i === 0 ? '0 0 14px rgba(0,255,65,0.45)' : 'none',
              marginBottom: 6,
            }}>
              {item.value ?? '—'}
            </div>
            <div style={{
              fontFamily: FONT, fontSize: 9,
              color: 'rgba(0,204,53,0.28)', letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

const API_BASE = import.meta.env.VITE_API_URL || ''
const LANG_ORDER = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++']
const LANG_BADGE = {
  javascript: 'JS', typescript: 'TS', python: 'PY',
  java: 'JV', go: 'GO', rust: 'RS', 'c++': 'C+',
}

export default function Stats() {
  const [stats, setStats]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [activeLang, setActiveLang] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/sessions/stats`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
      .then(({ data }) => {
        setStats(data)
        const first = LANG_ORDER.find(l => data.byLanguage?.some(s => s.language === l))
        if (first) setActiveLang(first)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const byLang  = stats?.byLanguage ?? []
  const global  = stats?.global ?? null
  const langMap = Object.fromEntries(byLang.map(s => [s.language, s]))
  const availLangs = [
    ...LANG_ORDER.filter(l => langMap[l]),
    ...byLang.filter(s => !LANG_ORDER.includes(s.language)).map(s => s.language),
  ]
  const maxAvg     = Math.max(1, ...byLang.map(s => s.avgWpm))
  const activeStat = activeLang ? langMap[activeLang] : null

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
            &gt;&nbsp; stats
          </div>
          <h1 style={{
            fontFamily: FONT, fontSize: 22, fontWeight: 700, margin: 0,
            color: '#00FF41',
            textShadow: '0 0 20px rgba(0,255,65,0.55), 0 0 40px rgba(0,255,65,0.2)',
            letterSpacing: '0.03em', lineHeight: 1,
          }}>
            global stats
          </h1>
        </div>

        {/* loading */}
        {loading && (
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,80,0,0.17)', background: 'rgba(0,5,0,0.5)' }}>
            <SkeletonRows count={7} />
          </div>
        )}

        {/* error */}
        {error && (
          <div style={{
            borderRadius: 14, padding: '16px 20px',
            background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)',
          }}>
            <p style={{ fontFamily: FONT, fontSize: 13, color: '#FF4444', marginBottom: 4 }}>connection error</p>
            <p style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,68,68,0.5)' }}>{error}</p>
          </div>
        )}

        {/* empty */}
        {!loading && !error && byLang.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(0,204,53,0.22)', letterSpacing: '0.2em' }}>
              no sessions yet — complete a test to see stats
            </div>
          </div>
        )}

        {/* content */}
        {!loading && !error && global && byLang.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>

            {/* global strip */}
            <StatStrip items={[
              { label: 'sessions',  value: global.totalSessions },
              { label: 'avg wpm',   value: global.avgWpm },
              { label: 'best wpm',  value: global.topWpm },
            ]} />

            {/* avg wpm chart — also acts as language selector */}
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              border: '1px solid rgba(0,88,0,0.18)',
              background: 'rgba(0,5,0,0.5)',
              marginBottom: 20,
            }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2.4rem 1fr 3rem',
                gap: 12, padding: '10px 20px',
                borderBottom: '1px solid rgba(0,60,0,0.22)',
                fontFamily: FONT, fontSize: 9,
                letterSpacing: '0.15em', color: 'rgba(0,204,53,0.22)',
                textTransform: 'uppercase',
              }}>
                <span>lang</span>
                <span>avg wpm</span>
                <span style={{ textAlign: 'right' }}>wpm</span>
              </div>
              {availLangs.map(l => (
                <WpmBar
                  key={l}
                  badge={LANG_BADGE[l] ?? l}
                  label={l}
                  value={langMap[l]?.avgWpm ?? 0}
                  max={maxAvg}
                  active={activeLang === l}
                  onClick={() => setActiveLang(activeLang === l ? null : l)}
                />
              ))}
            </div>

            {/* per-language detail panel */}
            <AnimatePresence mode="wait">
              {activeStat && <LangDetailPanel key={activeLang} stat={activeStat} />}
            </AnimatePresence>

          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
