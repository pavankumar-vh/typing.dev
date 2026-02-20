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
