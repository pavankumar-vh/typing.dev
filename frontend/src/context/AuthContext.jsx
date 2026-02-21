import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../config/firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)   // Firebase user object
  const [loading, setLoading] = useState(true)   // true until first auth check

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  async function signup(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    // Persist display name to localStorage too (for Avatar component)
    localStorage.setItem('profile_name', displayName)
    return cred
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    // Sync display name to localStorage
    if (cred.user.displayName) localStorage.setItem('profile_name', cred.user.displayName)
    return cred
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
  }

  // Returns the Firebase ID token for authenticating API requests
  async function getToken() {
    if (!user) return null
    return user.getIdToken()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
