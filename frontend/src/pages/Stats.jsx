import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const LANG_ORDER = ['javascript', 'python', 'java']

function StatCard({ label, value, sub, dim }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm tracking-widest text-muted opacity-80 select-none">{label}</p>
      <p
        className={`text-5xl tabular-nums transition-all ${
          dim ? 'text-muted' : 'text-text glow-text'
        }`}
      >
        {value ?? '—'}
      </p>
      {sub && (
        <p className="text-xs text-muted opacity-40 tabular-nums">{sub}</p>
      )}
    </div>
  )
}

function LangSection({ stat }) {
  return (
    <div className="border border-divider p-8" style={{ borderColor: 'rgba(0,51,0,0.5)' }}>
      <p className="text-sm tracking-widest text-muted mb-8 select-none">
        &gt; {stat.language}
      </p>
      <div className="grid grid-cols-2 gap-x-12 gap-y-10 sm:grid-cols-3">
        <StatCard label="avg wpm" value={stat.avgWpm} />
        <StatCard label="top wpm" value={stat.topWpm} />
        <StatCard label="avg accuracy" value={`${stat.avgAccuracy}%`} />
        <StatCard label="avg raw" value={stat.avgRawWpm} dim />
        <StatCard label="avg errors" value={stat.avgErrors} dim />
        <StatCard label="total sessions" value={stat.totalSessions} dim />
      </div>
    </div>
  )
}

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/sessions/stats`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then(({ data }) => setStats(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // data shape: { global: {...}, byLanguage: [{language, avgWpm, ...}] }
  const byLang = stats?.byLanguage ?? []
  const global = stats?.global ?? null

  const sorted = LANG_ORDER.map((l) => byLang.find((s) => s.language === l)).filter(Boolean)

  return (
    <div className="min-h-[calc(100vh-53px)] flex flex-col items-center px-8 pt-16 pb-24">
      <div className="w-full max-w-3xl">

        <p className="text-sm tracking-widest text-muted opacity-80 mb-8 select-none">
          &gt; stats
        </p>

        {loading && (
          <p className="text-muted text-sm tracking-widest opacity-60 animate-pulse">
            loading...
          </p>
        )}

        {error && (
          <p className="text-error glow-error text-sm tracking-widest">
            error: {error}
            <span className="block mt-1 opacity-70">is the backend running?</span>
          </p>
        )}

        {!loading && !error && stats && byLang.length === 0 && (
          <p className="text-muted text-sm tracking-widest opacity-60">
            no data yet — complete a test to see stats
          </p>
        )}

        {!loading && !error && global && (
          <div className="flex flex-col gap-6">
            {/* Global summary */}
            <div className="grid grid-cols-3 gap-12 border-b border-divider pb-12 mb-4"
                 style={{ borderColor: 'rgba(0,85,0,0.5)' }}>
              <StatCard label="total sessions" value={global.totalSessions} />
              <StatCard label="global avg wpm" value={global.avgWpm} />
              <StatCard label="all-time best" value={global.topWpm} />
            </div>

            {/* Per-language */}
            {sorted.map((s) => (
              <LangSection key={s.language} stat={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
