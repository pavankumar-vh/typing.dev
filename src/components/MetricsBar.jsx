export default function MetricsBar({ cpm, accuracy, errors, timeRemaining }) {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="flex gap-8 text-sm text-muted py-4 border-b border-divider mb-8">
      <div>
        <span className="text-text">{cpm}</span> cpm
      </div>
      <div>
        <span className="text-text">{accuracy}%</span> accuracy
      </div>
      <div>
        <span className="text-error">{errors}</span> errors
      </div>
      <div className="ml-auto">
        <span className="text-text">{formatTime(timeRemaining)}</span> remaining
      </div>
    </div>
  )
}
