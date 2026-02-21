import { createContext, useContext, useState } from 'react'

const ConfigContext = createContext(null)

export const LANGUAGES = ['java', 'python', 'javascript']
export const DURATIONS  = [15, 30, 60, 120]

export function ConfigProvider({ children }) {
  const [language, setLanguage] = useState('javascript')
  const [duration, setDuration]  = useState(60)

  return (
    <ConfigContext.Provider value={{ language, setLanguage, duration, setDuration }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used inside ConfigProvider')
  return ctx
}
