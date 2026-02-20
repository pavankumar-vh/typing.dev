import { useLocation, useNavigate } from 'react-router-dom'

export default function Result() {
  const location = useLocation()
  const navigate = useNavigate()
  const { cpm, accuracy, errors, duration } = location.state || {}

  if (!cpm && cpm !== 0) {
    navigate('/')
    return null
  }

  return (
    <div className="max-w-xl mx-auto mt-12">
      <div className="mb-8 text-xs">
        <p className="glow-text text-text tracking-widest mb-1">SESSION TERMINATED</p>
        <p className="text-muted">PERFORMANCE REPORT FOLLOWS</p>
        <p className="text-muted mt-1">──────────────────────────────────────</p>
      </div>

      <div className="border-b border-divider pb-8 mb-8">
        <div className="grid grid-cols-2 gap-y-6 gap-x-16">
          <div>
            <p className="text-muted text-xs tracking-widest mb-1">&gt; CHARS/MIN</p>
            <p className="text-3xl glow-text text-text">{cpm}</p>
          </div>
          <div>
            <p className="text-muted text-xs tracking-widest mb-1">&gt; ACCURACY</p>
            <p className="text-3xl glow-text text-text">{accuracy}%</p>
          </div>
          <div>
            <p className="text-muted text-xs tracking-widest mb-1">&gt; ERRORS</p>
            <p className={`text-3xl ${errors > 0 ? 'glow-error text-error' : 'glow-text text-text'}`}>{errors}</p>
          </div>
          <div>
            <p className="text-muted text-xs tracking-widest mb-1">&gt; DURATION</p>
            <p className="text-3xl glow-text text-text">{duration}s</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 border border-text text-text text-xs tracking-widest glow-text hover:bg-panel transition-all"
      >
        [ REINITIALIZE SESSION ]
      </button>
    </div>
  )
}
