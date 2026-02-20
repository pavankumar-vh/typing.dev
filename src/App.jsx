import { Routes, Route } from 'react-router-dom'
import Setup from './pages/Setup.jsx'
import Train from './pages/Train.jsx'
import Result from './pages/Result.jsx'

function App() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  return (
    <>
      {/* CRT effects — fixed position overlays */}
      <div className="crt-scanlines" aria-hidden="true" />
      <div className="crt-vignette" aria-hidden="true" />

      <div className="crt-screen bg-bg text-text font-mono min-h-screen">
        {/* Terminal status bar */}
        <header className="px-8 py-3 flex items-center justify-between text-xs border-b border-divider">
          <div className="flex items-center gap-6">
            <span className="glow-text font-bold tracking-widest">
              TYPING.DEV
            </span>
            <span className="text-muted">v1.0.0</span>
            <span className="text-muted">|</span>
            <span className="text-muted">SYS:READY</span>
          </div>
          <div className="flex items-center gap-6 text-muted">
            <span>{dateStr}</span>
            <span className="text-text blink">█</span>
          </div>
        </header>

        <main className="px-8 py-8">
          <Routes>
            <Route path="/" element={<Setup />} />
            <Route path="/train" element={<Train />} />
            <Route path="/result" element={<Result />} />
          </Routes>
        </main>
      </div>
    </>
  )
}

export default App

