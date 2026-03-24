import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_URL || ''
const FONT = 'JetBrains Mono, monospace'

export default function Players() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearched(false); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      setSearched(true)
      fetch(`${API_BASE}/api/sessions/users/search?q=${encodeURIComponent(query.trim())}`)
        .then(r => r.json())
        .then(d => setResults(d.data ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  return (
    <motion.div
      className="page-wrap"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{ width: '100%', maxWidth: 640 }}>

        {/* Header */}
        <div className="page-header">
          <div className="page-header-prompt">
            <span className="page-header-dot" />
            <span>&gt; players</span>
          </div>
          <h1>find players</h1>
          <div className="page-header-divider" />
        </div>

        {/* Search input */}
        <div className="player-search-box">
          <span className="player-search-icon">⌕</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="search by username..."
            className="player-search-input"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="player-search-clear">✕</button>
          )}
        </div>

        {/* Results */}
        <div style={{ marginTop: 24 }}>
          {loading && (
            <div style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(0,204,53,0.3)', padding: '20px 0' }}>
              searching...
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(0,204,53,0.25)', padding: '20px 0' }}>
              no players found for "{query}"
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {results.map((user, i) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <Link
                  to={`/profile/${user.userId}`}
                  className="player-card"
                >
                  {/* Avatar */}
                  <div className="player-avatar">
                    {(user.displayName || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="player-name">{user.displayName}</div>
                    <div className="player-meta">
                      {user.totalSessions} tests · {user.topLanguage}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="player-stats">
                    <div className="player-stat-main">{user.topWpm}</div>
                    <div className="player-stat-label">best wpm</div>
                  </div>
                  <div className="player-stats">
                    <div className="player-stat-sub">{user.avgWpm}</div>
                    <div className="player-stat-label">avg</div>
                  </div>
                  <div className="player-stats">
                    <div className="player-stat-sub">{user.avgAccuracy}%</div>
                    <div className="player-stat-label">acc</div>
                  </div>

                  {/* Arrow */}
                  <span className="player-arrow">→</span>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Hint when idle */}
        {!searched && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontFamily: FONT, fontSize: 12, color: 'rgba(0,204,53,0.2)',
              textAlign: 'center', marginTop: 60,
            }}
          >
            type a name to search for players
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
