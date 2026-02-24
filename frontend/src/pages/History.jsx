import { useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''
const LANGS = ['all', 'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++']
const SORTS = ['newest', 'top']

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
    <div className="min-h-[calc(100vh-53px)] flex flex-col items-center px-8 pt-16 pb-24">
      <div className="w-full max-w-3xl">

        <p className="text-sm tracking-widest text-muted opacity-80 mb-8 select-none">
          &gt; history
        </p>

        {/* Filter bar */}
          <div className="flex items-center gap-6 mb-10 text-sm tracking-widest select-none">
          {/* Language filter */}
          <div className="flex gap-1">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 transition-all ${
                  lang === l
                    ? 'text-text glow-text'
                    : 'text-muted opacity-40 hover:opacity-100 hover:text-text'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <span className="text-divider opacity-40">│</span>

          {/* Sort */}
          <div className="flex gap-1">
            {SORTS.map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 transition-all ${
                  sort === s
                    ? 'text-text glow-text'
                    : 'text-muted opacity-40 hover:opacity-100 hover:text-text'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
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

        {!loading && !error && sessions.length === 0 && (
          <p className="text-muted text-sm tracking-widest opacity-60">
            no sessions yet — complete a test to see history
          </p>
        )}

        {!loading && !error && sessions.length > 0 && (
          <>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-muted text-sm tracking-widest text-left border-b border-divider">
                  <th className="pb-4 pr-6 font-normal opacity-60">lang</th>
                  <th className="pb-4 pr-6 font-normal opacity-60">wpm</th>
                  <th className="pb-4 pr-6 font-normal opacity-60">raw</th>
                  <th className="pb-4 pr-6 font-normal opacity-60">acc</th>
                  <th className="pb-4 pr-6 font-normal opacity-60">errors</th>
                  <th className="pb-4 pr-6 font-normal opacity-60">time</th>
                  <th className="pb-4 font-normal opacity-60 text-right">when</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr
                    key={s._id ?? i}
                    className="border-b opacity-80 hover:opacity-100 transition-all"
                    style={{ borderColor: 'rgba(0,51,0,0.5)' }}
                  >
                    <td className="py-3 pr-6 text-muted text-sm tracking-widest">
                      {s.language}
                    </td>
                    <td className="py-3 pr-6 text-text tabular-nums text-base">{s.wpm}</td>
                    <td className="py-3 pr-6 text-muted tabular-nums text-sm">{s.rawWpm}</td>
                    <td className="py-3 pr-6 tabular-nums text-sm">
                      <span
                        className={
                          s.accuracy >= 95
                            ? 'text-text'
                            : s.accuracy >= 80
                            ? 'text-muted'
                            : 'text-error'
                        }
                      >
                        {s.accuracy}%
                      </span>
                    </td>
                    <td
                      className={`py-3 pr-6 tabular-nums text-sm ${
                        s.errors > 0 ? 'text-error' : 'text-muted'
                      }`}
                    >
                      {s.errors}
                    </td>
                    <td className="py-3 pr-6 text-muted tabular-nums text-sm">
                      {s.duration}s
                    </td>
                    <td className="py-3 text-muted text-sm text-right opacity-70">
                      {s.createdAt ? timeAgo(s.createdAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-muted text-sm opacity-50 mt-6 text-right tabular-nums">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
