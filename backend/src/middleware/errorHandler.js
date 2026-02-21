// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ success: false, error: messages.join(', ') })
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' })
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ success: false, error: 'Duplicate entry' })
  }

  const status = err.statusCode || err.status || 500
  const message = err.message || 'Internal server error'

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[error] ${status} ${req.method} ${req.path} — ${message}`)
  }

  res.status(status).json({ success: false, error: message })
}
