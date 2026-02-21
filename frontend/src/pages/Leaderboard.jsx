import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const LANGS    = ['javascript', 'python', 'java']

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function ColHead({ children, right }) {
  return (
    <th className={`pb-4 font-normal text-muted text-xs tracking-widest opacity-50 uppercase ${right ? 'text-right' : ''}`}>
      {children}
    </th>
  )
}

export default function Leaderboard() {
  const { user } = useAuth()
  const [mode, setMode]     = useState('lang')   // 'lang' | 'users'
  const [lang, setLang]     = useState('javascript')
  const [langData, setLangData] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`${API_BASE}/api/sessions/leaderboard`).then(r => r.json()),
      fetch(`${API_BASE}/api/sessions/leaderboard/users`).then(r => r.json()),
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

  const langRows = langData?.[lang] ?? []
  const userRows = userData ?? []

  return (
    <div className="min-h-[calc(100vh-53px)] flex flex-col items-center px-8 pt-14 pb-24">
      <div className="w-full max-w-3xl">

        <p className="text-xs tracking-[0.3em] text-muted opacity-40 mb-12 select-none uppercase">
          &gt;&nbsp; leaderboard
        </p>

        {/* ── Mode tabs ─────────────────────────────────── */}
        <div className="flex items-center gap-8 mb-10" style={{ borderBottom: '1px solid rgba(0,255,65,0.1)' }}>
          {[
            { id: 'lang',  label: 'by language' },
            { id: 'users', label: 'all users'   },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`pb-3 text-xs tracking-widest transition-all select-none ${
                mode === id
                  ? 'text-text glow-text border-b-2'
                  : 'text-muted opacity-40 hover:opacity-80 hover:text-text'
              }`}
              style={mode === id ? { borderColor: '#00FF41' } : {}}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Loading / Error ───────────────────────────── */}
        {loading && (
          <p className="text-muted text-sm tracking-widest opacity-40 animate-pulse">loading...</p>
        )}
        {error && (
          <p className="text-error text-sm tracking-widest">
            error: {error}
            <span className="block mt-1 opacity-60 text-xs">is the backend running?</span>
          </p>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* MODE: by language                             */}
        {/* ══════════════════════════════════════════════ */}
        {!loading && !error && mode === 'lang' && (
          <>
            {/* Language pills */}
            <div className="flex gap-1 mb-8 text-sm tracking-widest text-muted select-none">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 transition-all ${
                    lang === l ? 'text-text glow-text border-b' : 'opacity-40 hover:opacity-100 hover:text-text'
                  }`}
                  style={lang === l ? { borderColor: 'rgba(0,255,65,0.5)' } : {}}
                >
                  {l}
                </button>
              ))}
            </div>

            {langRows.length === 0 ? (
              <p className="text-muted text-sm tracking-widest opacity-40">
                no sessions yet — complete a test to appear here
              </p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,85,0,0.4)' }}>
                    <ColHead>#</ColHead>
                    <ColHead>player</ColHead>
                    <ColHead>wpm</ColHead>
                    <ColHead>raw</ColHead>
                    <ColHead>acc</ColHead>
                    <ColHead>errors</ColHead>
                    <ColHead>time</ColHead>
                    <ColHead right>when</ColHead>
                  </tr>
                </thead>
                <tbody>
                  {langRows.map((row, i) => {
                    const isTop  = i === 0
                    const isMe   = user && row.userId === user.uid
                    return (
                      <tr
                        key={row._id ?? i}
                        className="transition-all"
                        style={{
                          borderBottom: '1px solid rgba(0,51,0,0.5)',
                          opacity: isTop ? 1 : 0.75,
                          background: isMe ? 'rgba(0,255,65,0.04)' : 'transparent',
                        }}
                      >
                        <td className="py-4 pr-4 text-muted text-xs tabular-nums w-8">{i + 1}</td>
                        <td className="py-4 pr-6 text-sm max-w-[7rem] truncate">
                          <span className={isMe ? 'text-text glow-text' : 'text-muted opacity-60'}>
                            {row.displayName || 'anon'}
                          </span>
                          {isMe && <span className="text-xs opacity-40 ml-2">(you)</span>}
                        </td>
                        <td className={`py-4 pr-6 tabular-nums ${isTop ? 'text-text glow-text text-xl' : 'text-text text-base'}`}>
                          {row.wpm}
                        </td>
                        <td className="py-4 pr-6 text-muted tabular-nums text-sm">{row.rawWpm}</td>
                        <td className={`py-4 pr-6 tabular-nums text-sm ${row.accuracy >= 95 ? 'text-text' : row.accuracy >= 80 ? 'text-muted' : 'text-error'}`}>
                          {row.accuracy}%
                        </td>
                        <td className={`py-4 pr-6 tabular-nums text-sm ${row.errors > 0 ? 'text-error' : 'text-muted'}`}>
                          {row.errors}
                        </td>
                        <td className="py-4 pr-6 text-muted text-sm tabular-nums">{row.duration}s</td>
                        <td className="py-4 text-muted text-xs text-right opacity-50">
                          {row.createdAt ? timeAgo(row.createdAt) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* MODE: all users                               */}
        {/* ══════════════════════════════════════════════ */}
        {!loading && !error && mode === 'users' && (
          <>
            {userRows.length === 0 ? (
              <p className="text-muted text-sm tracking-widest opacity-40">
                no users yet — sign up and complete a test
              </p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,85,0,0.4)' }}>
                    <ColHead>#</ColHead>
                    <ColHead>player</ColHead>
                    <ColHead>best wpm</ColHead>
                    <ColHead>avg wpm</ColHead>
                    <ColHead>accuracy</ColHead>
                    <ColHead right>tests</ColHead>
                  </tr>
                </thead>
                <tbody>
                  {userRows.map((row, i) => {
                    const isTop = i === 0
                    const isMe  = user && row.userId === user.uid
                    return (
                      <tr
                        key={row.userId ?? i}
                        className="transition-all"
                        style={{
                          borderBottom: '1px solid rgba(0,51,0,0.5)',
                          opacity: isTop ? 1 : 0.8,
                          background: isMe ? 'rgba(0,255,65,0.04)' : 'transparent',
                        }}
                      >
                        <td className="py-4 pr-4 text-muted text-xs tabular-nums w-8">{i + 1}</td>
                        <td className="py-4 pr-6 max-w-[9rem] truncate">
                          <span className={isMe ? 'text-text glow-text font-bold' : 'text-text'}>
                            {row.displayName || 'anon'}
                          </span>
                          {isMe && <span className="text-xs text-muted opacity-40 ml-2">(you)</span>}
                        </td>
                        <td className={`py-4 pr-6 tabular-nums ${isTop ? 'text-text glow-text text-xl' : 'text-text text-base'}`}>
                          {row.topWpm}
                        </td>
                        <td className="py-4 pr-6 text-muted tabular-nums">{row.avgWpm}</td>
                        <td className={`py-4 pr-6 tabular-nums ${row.avgAccuracy >= 95 ? 'text-text' : 'text-muted'}`}>
                          {row.avgAccuracy}%
                        </td>
                        <td className="py-4 text-muted tabular-nums text-xs text-right opacity-60">
                          {row.totalSessions}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

      </div>
    </div>
  )
}

