import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const languages = ['Java', 'Python', 'JavaScript']
const durations = [30, 60, 120]

export default function Setup() {
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState(null)
  const navigate = useNavigate()

  const handleStart = () => {
    if (!selectedLanguage || !selectedDuration) return
    navigate('/train', {
      state: { language: selectedLanguage, duration: selectedDuration },
    })
  }

  return (
    <div className="max-w-xl mx-auto mt-12">
      {/* Boot header */}
      <div className="mb-8 text-xs text-muted">
        <p className="text-text glow-text mb-1">TYPING.DEV TRAINING CONSOLE</p>
        <p>CONFIGURE SESSION PARAMETERS BELOW</p>
        <p className="mt-1">──────────────────────────────────────</p>
      </div>

      <div className="border-b border-divider mb-8 pb-8">
        <p className="text-muted text-xs uppercase tracking-widest mb-4">
          &gt; SELECT LANGUAGE
        </p>
        <div className="flex gap-4">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-4 py-2 border text-sm tracking-wider transition-all ${
                selectedLanguage === lang
                  ? 'border-text text-text glow-text bg-panel'
                  : 'border-divider text-muted hover:border-muted hover:text-text'
              }`}
            >
              {selectedLanguage === lang ? '► ' : '  '}{lang}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-divider mb-8 pb-8">
        <p className="text-muted text-xs uppercase tracking-widest mb-4">
          &gt; SELECT DURATION
        </p>
        <div className="flex gap-4">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDuration(d)}
              className={`px-4 py-2 border text-sm tracking-wider transition-all ${
                selectedDuration === d
                  ? 'border-text text-text glow-text bg-panel'
                  : 'border-divider text-muted hover:border-muted hover:text-text'
              }`}
            >
              {selectedDuration === d ? '► ' : '  '}{d}s
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!selectedLanguage || !selectedDuration}
        className={`px-6 py-2 border text-sm tracking-widest transition-all ${
          selectedLanguage && selectedDuration
            ? 'border-text text-text glow-text bg-panel hover:bg-divider'
            : 'border-divider text-muted cursor-not-allowed'
        }`}
      >
        {selectedLanguage && selectedDuration ? '[ INITIATE TRAINING SESSION ]' : '[ SELECT PARAMETERS ]'}
      </button>
    </div>
  )
}
