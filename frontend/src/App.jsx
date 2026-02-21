import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Stats from './pages/Stats.jsx'
import History from './pages/History.jsx'
import Profile from './pages/Profile.jsx'
import MyStats from './pages/MyStats.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import BootScreen from './components/BootScreen.jsx'
import { ConfigProvider } from './context/ConfigContext.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

const NAV = [
  { to: '/',            label: 'test',       end: true },
  { to: '/leaderboard', label: 'leaderboard' },
  { to: '/stats',       label: 'stats'       },
  { to: '/my-stats',    label: 'my stats'    },
]

function Avatar() {
  const { user } = useAuth()
  const name  = user?.displayName || localStorage.getItem('profile_name') || ''
  const color = localStorage.getItem('profile_color') || '#00FF41'
  const initials = name
    ? name.trim().split(/\s+/).map((w) => w[0].toUpperCase()).slice(0, 2).join('')
    : '?'
  return (
    <NavLink
      to="/profile"
      title={name || 'Profile'}
      className="flex items-center justify-center font-bold select-none transition-all"
      style={({ isActive }) => ({
        width: 28, height: 28, borderRadius: '50%',
        background: 'rgba(0,10,0,0.85)',
        border: `1.5px solid ${color}`,
        color,
        fontSize: 11,
        boxShadow: isActive ? `0 0 10px ${color}66` : 'none',
        fontFamily: 'JetBrains Mono, monospace',
        textDecoration: 'none',
      })}
    >
      {initials}
    </NavLink>
  )
}

function AppShell({ booted, setBooted }) {
  const { user, loading } = useAuth()

  if (loading) return null  // wait for auth state before rendering

  return (
    <div className="bg-bg text-text font-mono min-h-screen">
      <div className="crt-scanlines" aria-hidden="true" />
      <div className="crt-vignette" aria-hidden="true" />

      {!booted && <BootScreen onComplete={() => setBooted(true)} />}

      <div
        className="crt-screen"
        style={{ opacity: booted ? 1 : 0, transition: 'opacity 0.5s ease 0.2s' }}
      >
        {/* ── Header ── */}
        <header
          className="px-8 py-3 grid items-center"
          style={{
            gridTemplateColumns: '1fr auto 1fr',
            borderBottom: '1px solid rgba(0,255,65,0.18)',
            background: 'rgba(0,10,0,0.6)',
            backdropFilter: 'blur(2px)',
          }}
        >
          {/* Left — logo */}
          <NavLink
            to="/"
            className="flex items-center gap-2 text-sm tracking-[0.2em] glow-text text-text select-none font-bold w-fit"
          >
            <span className="opacity-80">&gt;_</span>
            typing.dev
          </NavLink>

          {/* Center — empty */}
          <div />

          {/* Right — nav links + auth + avatar */}
          <nav className="flex items-center gap-6 justify-end">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `text-xs tracking-widest transition-all select-none ${
                    isActive
                      ? 'text-text glow-text'
                      : 'text-muted opacity-70 hover:opacity-100 hover:text-text'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

            {!user ? (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `text-xs tracking-widest transition-all select-none ${
                    isActive ? 'text-text glow-text' : 'text-muted opacity-70 hover:opacity-100 hover:text-text'
                  }`
                }
              >
                login
              </NavLink>
            ) : (
              <Avatar />
            )}
          </nav>
        </header>

        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/stats"       element={<Stats />} />
          <Route path="/my-stats"    element={<MyStats />} />
          <Route path="/history"     element={<History />} />
          <Route path="/profile"     element={<Profile />} />
          <Route path="/login"       element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/signup"      element={user ? <Navigate to="/" replace /> : <Signup />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  const [booted, setBooted] = useState(false)

  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider>
          <AppShell booted={booted} setBooted={setBooted} />
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

