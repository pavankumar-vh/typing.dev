import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_URL || ''
const LANGS = ['all', 'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++']
const SORTS = ['newest', 'top']
const LANG_BADGE = {
  javascript: 'JS', typescript: 'TS', python: 'PY',
  java: 'JV', go: 'GO', rust: 'RS', 'c++': 'C+',
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function History() {
  const [lang, setLang] = useState('all')
  const [sort, setSort] = useState('newest')
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ limit: '50', sort })
    if (lang !== 'all') params.set('language', lang)

    fetch(`${API_BASE}/api/sessions?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then(({ data }) => setSessions(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [lang, sort])

  useEffect(() => { load() }, [load])

  return (
    <motion.div
      className="page-wrap"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{ width: '100%', maxWidth: 720 }}>

        {/* Page header */}
        <div className="page-header">
          <div className="page-header-prompt">
            <span className="page-header-dot" />
            <span>&gt; session log</span>
          </div>
          <h1>history</h1>
          <div className="page-header-divider" />
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          {LANGS.map((l) => {
            const active = lang === l
            const badge = l === 'all' ? 'ALL' : (LANG_BADGE[l] ?? l.slice(0, 2).toUpperCase())
            return (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`page-pill ${active ? 'page-pill-active' : ''}`}
              >
                <span className={`page-badge ${active ? 'page-badge-active' : ''}`}>{badge}</span>
                {l}
              </button>
            )
          })}

          <div style={{ width: 1, height: 20, background: 'rgba(0,100,0,0.3)', margin: '0 8px', flexShrink: 0 }} />

          {SORTS.map((s) => {
            const active = sort === s
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`page-pill ${active ? 'page-pill-active' : ''}`}
              >
                {s}
              </button>
            )
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="page-card" style={{ padding: '20px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 0',
                borderBottom: i < 5 ? '1px solid rgba(0,60,0,0.18)' : 'none',
                opacity: 1 - i * 0.12,
              }}>
                <div className="lb-skeleton" style={{ width: 36, height: 14, borderRadius: 4 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="lb-skeleton" style={{ width: `${70 - i * 8}%`, height: 12 }} />
                  <div className="lb-skeleton" style={{ width: `${90 - i * 5}%`, height: 3 }} />
                </div>
                <div className="lb-skeleton" style={{ width: 44, height: 14, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: 14, padding: '16px 20px',
              background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)',
            }}
          >
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#FF4444', marginBottom: 4 }}>connection error</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,68,68,0.5)' }}>{error}</p>
          </motion.div>
        )}

        {/* Empty */}
        {!loading && !error && sessions.length === 0 && (
          <div className="page-empty">
            no sessions yet &mdash; complete a test to see history
          </div>
        )}

        {/* Table */}
        {!loading && !error && sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            {/* Summary strip */}
            <div className="page-stat-strip">
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 19, fontWeight: 700, color: '#00FF41', textShadow: '0 0 12px rgba(0,255,65,0.5)', lineHeight: 1 }}>
                  {sessions.length}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(0,204,53,0.32)', letterSpacing: '0.15em', marginTop: 5, textTransform: 'uppercase' }}>
                  sessions
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 19, fontWeight: 700, color: '#00FF41', textShadow: '0 0 12px rgba(0,255,65,0.5)', lineHeight: 1 }}>
                  {Math.max(...sessions.map(s => s.wpm))}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(0,204,53,0.32)', letterSpacing: '0.15em', marginTop: 5, textTransform: 'uppercase' }}>
                  best wpm
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 19, fontWeight: 700, color: '#00FF41', textShadow: '0 0 12px rgba(0,255,65,0.5)', lineHeight: 1 }}>
                  {Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length)}%
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(0,204,53,0.32)', letterSpacing: '0.15em', marginTop: 5, textTransform: 'uppercase' }}>
                  avg acc
                </div>
              </div>
            </div>

            <div className="page-card" style={{ position: 'relative' }}>
              <div className="page-scanline" />
              <table className="history-table">
                <thead>
                  <tr>
                    <th>lang</th>
                    <th>wpm</th>
                    <th>raw</th>
                    <th>acc</th>
                    <th>errors</th>
                    <th>time</th>
                    <th>when</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <motion.tr
                      key={s._id ?? i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                    >
                      <td>
                        <span className="page-badge">{LANG_BADGE[s.language] ?? s.language?.slice(0, 2).toUpperCase()}</span>
                      </td>
                      <td style={{ fontSize: 14, fontWeight: 600, color: '#00FF41', textShadow: '0 0 8px rgba(0,255,65,0.3)', fontVariantNumeric: 'tabular-nums' }}>
                        {s.wpm}
                      </td>
                      <td style={{ fontSize: 12, color: 'rgba(0,204,53,0.4)', fontVariantNumeric: 'tabular-nums' }}>
                        {s.rawWpm}
                      </td>
                      <td style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: s.accuracy >= 95 ? '#00FF41' : s.accuracy >= 80 ? 'rgba(0,204,53,0.55)' : '#FF4444' }}>
                        {s.accuracy}%
                      </td>
                      <td style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: s.errors > 0 ? '#FF4444' : 'rgba(0,204,53,0.28)' }}>
                        {s.errors}
                      </td>
                      <td style={{ fontSize: 11, color: 'rgba(0,204,53,0.35)', fontVariantNumeric: 'tabular-nums' }}>
                        {s.duration}s
                      </td>
                      <td style={{ fontSize: 10, color: 'rgba(0,204,53,0.22)' }}>
                        {s.createdAt ? timeAgo(s.createdAt) : '\u2014'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10, color: 'rgba(0,204,53,0.2)', letterSpacing: '0.15em',
              textAlign: 'right', marginTop: 12, fontVariantNumeric: 'tabular-nums',
            }}>
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
