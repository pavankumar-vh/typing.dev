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
    <div className="max-w-xl mx-auto mt-16">
      <p className="text-muted text-sm mb-8">select training parameters</p>

      <div className="border-b border-divider mb-8 pb-8">
        <p className="text-muted text-xs uppercase tracking-widest mb-4">
          language
        </p>
        <div className="flex gap-4">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-4 py-2 border text-sm cursor-pointer transition-colors ${
                selectedLanguage === lang
                  ? 'border-accent text-accent'
                  : 'border-divider text-text hover:bg-panel'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-divider mb-8 pb-8">
        <p className="text-muted text-xs uppercase tracking-widest mb-4">
          duration
        </p>
        <div className="flex gap-4">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDuration(d)}
              className={`px-4 py-2 border text-sm cursor-pointer transition-colors ${
                selectedDuration === d
                  ? 'border-accent text-accent'
                  : 'border-divider text-text hover:bg-panel'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!selectedLanguage || !selectedDuration}
        className={`px-6 py-2 border text-sm cursor-pointer transition-colors ${
          selectedLanguage && selectedDuration
            ? 'border-accent text-accent hover:bg-panel'
            : 'border-divider text-muted cursor-not-allowed'
        }`}
      >
        start training →
      </button>
    </div>
  )
}
