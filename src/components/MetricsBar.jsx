export default function MetricsBar({ cpm, accuracy, errors, timeRemaining }) {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="flex gap-8 text-xs text-muted py-3 border-b border-divider mb-8 tracking-widest">
      <div>
        <span className="text-muted uppercase">CPM </span>
        <span className="glow-text text-text text-sm">{cpm}</span>
      </div>
      <div>
        <span className="text-muted uppercase">ACC </span>
        <span className="glow-text text-text text-sm">{accuracy}%</span>
      </div>
      <div>
        <span className="text-muted uppercase">ERR </span>
        <span className={`text-sm ${errors > 0 ? 'glow-error text-error' : 'text-text'}`}>{errors}</span>
      </div>
      <div className="ml-auto">
        <span className="text-muted uppercase">TIME </span>
        <span className={`text-sm glow-text ${timeRemaining <= 10 ? 'text-error glow-error' : 'text-text'}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
    </div>
  )
}
