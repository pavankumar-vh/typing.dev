import Home from './pages/Home.jsx'

function App() {
  return (
    <div className="bg-bg text-text font-mono min-h-screen">
      {/* CRT overlays */}
      <div className="crt-scanlines" aria-hidden="true" />
      <div className="crt-vignette" aria-hidden="true" />

      <div className="crt-screen">
        {/* Minimal header */}
        <header className="px-8 py-3 flex items-center justify-between border-b border-divider">
          <span className="text-xs tracking-widest glow-text text-text select-none">
            typing.dev
          </span>
          <span className="text-xs text-muted opacity-40 blink select-none">█</span>
        </header>

        <Home />
      </div>
    </div>
  )
}

export default App
