import { createContext, useContext, useState } from 'react'

const ConfigContext = createContext(null)

export const LANGUAGES    = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++']
export const DURATIONS    = [15, 30, 60, 120]
export const DIFFICULTIES = ['easy', 'medium', 'hard']
export const CODE_FOCUS   = ['snippets', 'algorithms', 'functions', 'classes']
export const SNIPPET_SIZES = ['short', 'medium', 'long']

// Maps config language keys → Gemini API expected names
export const LANG_API_MAP = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python:     'Python',
  java:       'Java',
  go:         'Go',
  rust:       'Rust',
  'c++':      'C++',
}

// Badge shown on pill button when a language is active
export const LANG_BADGE = {
  javascript: 'JS',
  typescript: 'TS',
  python:     'PY',
  java:       'JV',
  go:         'GO',
  rust:       'RS',
  'c++':      'C+',
}

export function ConfigProvider({ children }) {
  const [language,     setLanguage]     = useState('javascript')
  const [duration,     setDuration]     = useState(60)
  const [difficulty,   setDifficulty]   = useState('medium')
  const [codeFocus,    setCodeFocus]    = useState('snippets')
  const [snippetSize,  setSnippetSize]  = useState('medium')
  const [punctuation,  setPunctuation]  = useState(true)

  return (
    <ConfigContext.Provider value={{
      language,   setLanguage,
      duration,   setDuration,
      difficulty, setDifficulty,
      codeFocus,  setCodeFocus,
      snippetSize, setSnippetSize,
      punctuation, setPunctuation,
    }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used inside ConfigProvider')
  return ctx
}
