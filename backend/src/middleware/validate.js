// ── Request body validator for POST /api/sessions ────────
export function validateSession(req, res, next) {
  const { language, duration, wpm, rawWpm, accuracy, errors, snippetId } =
    req.body

  const VALID_LANGUAGES = ['javascript', 'python', 'java']
  const VALID_DURATIONS = [15, 30, 60, 120]

  const missing = []
  ;['language', 'duration', 'wpm', 'rawWpm', 'accuracy', 'errors', 'snippetId'].forEach(
    (field) => {
      if (req.body[field] === undefined || req.body[field] === null) {
        missing.push(field)
      }
    }
  )

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Missing required fields: ${missing.join(', ')}`,
    })
  }

  if (!VALID_LANGUAGES.includes(language?.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `language must be one of: ${VALID_LANGUAGES.join(', ')}`,
    })
  }

  if (!VALID_DURATIONS.includes(Number(duration))) {
    return res.status(400).json({
      success: false,
      error: `duration must be one of: ${VALID_DURATIONS.join(', ')}`,
    })
  }

  if (typeof wpm !== 'number' || wpm < 0) {
    return res.status(400).json({ success: false, error: 'wpm must be a non-negative number' })
  }

  if (typeof rawWpm !== 'number' || rawWpm < 0) {
    return res.status(400).json({ success: false, error: 'rawWpm must be a non-negative number' })
  }

  if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 100) {
    return res.status(400).json({ success: false, error: 'accuracy must be between 0 and 100' })
  }

  if (typeof errors !== 'number' || errors < 0) {
    return res.status(400).json({ success: false, error: 'errors must be a non-negative number' })
  }

  next()
}
