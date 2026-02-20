/**
 * Calculate characters per minute
 * @param {number} typedChars - total characters typed
 * @param {number} elapsedMs - elapsed time in milliseconds
 * @returns {number} CPM rounded to nearest integer
 */
export function calculateCPM(typedChars, elapsedMs) {
  if (elapsedMs <= 0) return 0
  const minutes = elapsedMs / 60000
  return Math.round(typedChars / minutes)
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
