import { useState, lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
const Landing = lazy(() => import('./pages/Landing.jsx'))
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
  { to: '/test',        label: 'test',       icon: '▸',  end: true },
  { to: '/leaderboard', label: 'leaderboard', icon: '◆' },
  { to: '/stats',       label: 'stats',       icon: '◈' },
  { to: '/my-stats',    label: 'my stats',    icon: '●' },
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
  const location = useLocation()
  const isLanding = location.pathname === '/'

  if (loading) return null  // wait for auth state before rendering

  return (
    <div className="bg-bg text-text font-mono min-h-screen">
      <div className="crt-scanlines" aria-hidden="true" />
      <div className="crt-vignette" aria-hidden="true" />

      {!booted && !isLanding && <BootScreen onComplete={() => setBooted(true)} />}

      <div
        className="crt-screen"
        style={{ opacity: (booted || isLanding) ? 1 : 0, transition: 'opacity 0.5s ease 0.2s' }}
      >
        {/* ── Header ── */}
        {!isLanding && <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="nav-header"
        >
          {/* Glow line at top */}
          <div className="nav-top-glow" />

          {/* Left — logo */}
          <NavLink to="/" className="nav-logo">
            <span className="nav-logo-bracket">&gt;_</span>
            <span className="nav-logo-text">typing.dev</span>
          </NavLink>

          {/* Center — pill nav */}
          <nav className="nav-pill-container">
            {NAV.map(({ to, label, icon, end }) => (
              <NavLink key={to} to={to} end={end} className="nav-pill-link">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-bg"
                        className="nav-active-indicator"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={`nav-pill-inner ${isActive ? 'nav-pill-active' : 'nav-pill-inactive'}`}>
                      <span className="nav-pill-icon">{icon}</span>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right — auth */}
          <div className="nav-auth-section">
            {!user ? (
              <NavLink to="/login" className="nav-login-btn">
                {({ isActive }) => (
                  <span className={isActive ? 'nav-login-active' : ''}>
                    login
                  </span>
                )}
              </NavLink>
            ) : (
              <Avatar />
            )}
          </div>
        </motion.header>}

        <Routes>
          <Route path="/"            element={<Suspense fallback={<div className="min-h-screen bg-bg" />}><Landing /></Suspense>} />
          <Route path="/test"        element={<Home />} />
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

