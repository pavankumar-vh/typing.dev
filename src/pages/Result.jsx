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
    <div className="max-w-xl mx-auto mt-16">
      <p className="text-muted text-xs uppercase tracking-widest mb-8">
        session complete
      </p>

      <div className="border-b border-divider pb-8 mb-8">
        <div className="grid grid-cols-2 gap-y-6 gap-x-16 text-sm">
          <div>
            <p className="text-muted mb-1">cpm</p>
            <p className="text-2xl text-text">{cpm}</p>
          </div>
          <div>
            <p className="text-muted mb-1">accuracy</p>
            <p className="text-2xl text-text">{accuracy}%</p>
          </div>
          <div>
            <p className="text-muted mb-1">errors</p>
            <p className="text-2xl text-error">{errors}</p>
          </div>
          <div>
            <p className="text-muted mb-1">duration</p>
            <p className="text-2xl text-text">{duration}s</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 border border-accent text-accent text-sm cursor-pointer hover:bg-panel transition-colors"
      >
        train again →
      </button>
    </div>
  )
}
