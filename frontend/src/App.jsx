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
import CursorGlow from './components/CursorGlow.jsx'
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
        width: 34, height: 34, borderRadius: '50%',
        background: 'rgba(0,10,0,0.9)',
        border: `1.5px solid ${color}`,
        color,
        fontSize: 12,
        boxShadow: isActive ? `0 0 14px ${color}66` : `0 0 0 ${color}00`,
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
          className="px-8 py-4 flex items-center justify-between"
          style={{
            borderBottom: '1px solid rgba(0,255,65,0.1)',
            background: 'rgba(0,8,0,0.7)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Left — logo */}
          <NavLink
            to="/"
            className="flex items-center gap-2 select-none font-bold w-fit"
            style={{ textDecoration: 'none', color: '#00FF41', textShadow: '0 0 12px rgba(0,255,65,0.7)', letterSpacing: '0.2em', fontSize: '0.9rem' }}
          >
            <span style={{ opacity: 0.7 }}>&gt;_</span>
            typing.dev
          </NavLink>

          {/* Center — pill nav */}
          <div
            className="flex items-center gap-1 px-2 py-1.5 rounded-2xl"
            style={{
              background: 'rgba(0,14,0,0.9)',
              border: '1px solid rgba(0,100,0,0.35)',
              boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
            }}
          >
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className="select-none"
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '6px 16px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  letterSpacing: '0.12em',
                  fontFamily: 'JetBrains Mono, monospace',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  color:      isActive ? '#00FF41' : 'rgba(0,204,53,0.5)',
                  background: isActive ? 'rgba(0,255,65,0.1)' : 'transparent',
                  textShadow: isActive ? '0 0 10px rgba(0,255,65,0.7)' : 'none',
                  boxShadow:  isActive ? 'inset 0 0 0 1px rgba(0,255,65,0.18)' : 'none',
                })}
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right — auth */}
          <div className="flex items-center gap-3">
            {!user ? (
              <NavLink
                to="/login"
                style={({ isActive }) => ({
                  padding: '6px 18px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  letterSpacing: '0.12em',
                  fontFamily: 'JetBrains Mono, monospace',
                  textDecoration: 'none',
                  border: '1px solid rgba(0,255,65,0.25)',
                  color:      isActive ? '#00FF41' : 'rgba(0,204,53,0.6)',
                  background: isActive ? 'rgba(0,255,65,0.08)' : 'transparent',
                  textShadow: isActive ? '0 0 10px rgba(0,255,65,0.7)' : 'none',
                  transition: 'all 0.15s',
                })}
              >
                login
              </NavLink>
            ) : (
              <Avatar />
            )}
          </div>
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
    <>
      <CursorGlow />
      <BrowserRouter>
        <AuthProvider>
          <ConfigProvider>
            <AppShell booted={booted} setBooted={setBooted} />
          </ConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  )
}

export default App

