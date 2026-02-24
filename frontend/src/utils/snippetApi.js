/**
 * snippetApi.js
 *
 * Thin wrapper around the backend /api/snippets endpoints.
 * Falls back to the local static dataset if the API is unavailable.
 */

import { getRandomSnippet } from '../data/snippets.js'

const API_BASE = ''

/**
 * Fetch a generated snippet from the backend (Gemini).
 * Returns a snippet object { id, language, difficulty, content }
 * or throws on failure.
 */
export async function fetchGeneratedSnippet(language, difficulty = 'medium') {
  const res = await fetch(`${API_BASE}/api/snippets/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, difficulty, count: 1 }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  const { snippets } = await res.json()
  if (!snippets?.length) throw new Error('Empty response from server')
  return snippets[0]
}

/**
 * Get a snippet — tries the live API first, falls back to local data.
 */
export async function getSnippet(language, difficulty = 'medium') {
  try {
    return await fetchGeneratedSnippet(language, difficulty)
  } catch (err) {
    console.warn('[snippetApi] Falling back to local snippets:', err.message)
    // Try language-specific local data first, fall back to JavaScript
    return getRandomSnippet(language) ?? getRandomSnippet('JavaScript') ?? null
  }
}

/**
 * Fetch supported languages/difficulties from the backend.
 */
export async function fetchLanguages() {
  const res = await fetch(`${API_BASE}/api/snippets/languages`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() // { languages, difficulties }
}
