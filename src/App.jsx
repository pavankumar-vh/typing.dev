import { Routes, Route } from 'react-router-dom'
import Setup from './pages/Setup.jsx'
import Train from './pages/Train.jsx'
import Result from './pages/Result.jsx'

function App() {
  return (
    <div className="bg-bg text-text font-mono min-h-screen">
      <header className="px-8 py-4">
        <span className="text-muted text-sm tracking-widest uppercase">
          Typing.dev
        </span>
      </header>
      <div className="border-b border-divider" />
      <main className="px-8 py-8">
        <Routes>
          <Route path="/" element={<Setup />} />
          <Route path="/train" element={<Train />} />
          <Route path="/result" element={<Result />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
