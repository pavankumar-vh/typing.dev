/**
 * Calculate words per minute (1 word = 5 characters)
 * @param {number} chars - characters to count (use correctChars for WPM, totalTyped for raw)
 * @param {number} elapsedMs - elapsed time in milliseconds
 * @returns {number} WPM rounded to nearest integer
 */
export function calculateWPM(chars, elapsedMs) {
  if (elapsedMs <= 0) return 0
  const minutes = elapsedMs / 60000
  return Math.round(chars / 5 / minutes)
}

/**
 * Calculate accuracy percentage
 * @param {number} correctChars - correctly typed characters
 * @param {number} totalTyped - total characters typed (correct + errors)
 * @returns {number} accuracy as percentage (0-100)
 */
export function calculateAccuracy(correctChars, totalTyped) {
  if (totalTyped <= 0) return 100
  return Math.round((correctChars / totalTyped) * 100)
}

/**
 * Standard deviation helper
 */
function stdDev(arr) {
  if (arr.length < 2) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

/**
 * Consistency score from a WPM-over-time sample array.
 * 100 = perfectly steady pace, 0 = wildly varying.
 * @param {number[]} samples - array of WPM values sampled over time
 * @returns {number} 0-100
 */
export function calculateConsistency(samples) {
  if (samples.length < 2) return 100
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  if (mean === 0) return 100
  return Math.max(0, Math.round((1 - stdDev(samples) / mean) * 100))
}

/**
 * Smooth WPM using a rolling time window on a timestamped char log.
 * @param {Array<{correct: boolean, ts: number}>} log
 * @param {number} windowMs - rolling window in ms (default 3000)
 * @returns {number} smoothed WPM
 */
export function rollingWPM(log, windowMs = 3000) {
  if (log.length === 0) return 0
  const now = log[log.length - 1].ts
  const cutoff = now - windowMs
  const recent = log.filter((e) => e.correct && e.ts >= cutoff)
  const elapsed = Math.min(windowMs, now - (log[0]?.ts ?? now))
  if (elapsed <= 0) return 0
  return Math.round((recent.length / 5 / elapsed) * 60000)
}
