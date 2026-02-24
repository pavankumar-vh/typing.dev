/**
 * snippetController.js
 *
 * POST /api/snippets/generate
 *   Body: { language, difficulty, count }
 *   Uses Gemini to generate fresh typing-test snippets on demand.
 *
 * GET  /api/snippets/languages
 *   Returns the list of supported languages.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const SUPPORTED_LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust']
const SUPPORTED_DIFFICULTIES = ['easy', 'medium', 'hard']
const MAX_COUNT = 10

function buildPrompt(language, difficulty, count) {
  const diffDesc = {
    easy:   'simple constructs — variables, loops, basic functions, ~5-10 lines',
    medium: 'algorithms, data structures, OOP or functional patterns, ~10-20 lines',
    hard:   'advanced patterns — generics, concurrency, complex algorithms, ~15-25 lines',
  }[difficulty]

  return `Generate exactly ${count} unique ${language} code snippets for a typing test.

Rules:
- Difficulty: ${difficulty} (${diffDesc})
- Each snippet must be realistic, idiomatic ${language}
- No markdown fences, no explanations — pure code only
- Separate each snippet with exactly this delimiter on its own line: ---SNIPPET---
- Do NOT number the snippets
- Avoid hello-world copies; vary topics (sorting, trees, HTTP, math, IO, etc.)

Return ONLY the ${count} snippets separated by ---SNIPPET---`
}

// ── GET /api/snippets/languages ───────────────────────────────────────────────
export async function getLanguages(_req, res) {
  res.json({ languages: SUPPORTED_LANGUAGES, difficulties: SUPPORTED_DIFFICULTIES })
}

// ── POST /api/snippets/generate ───────────────────────────────────────────────
export async function generateSnippets(req, res, next) {
  try {
    const {
      language   = 'JavaScript',
      difficulty = 'medium',
      count      = 3,
    } = req.body

    // Validation
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ error: `Unsupported language: ${language}` })
    }
    if (!SUPPORTED_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ error: `Unsupported difficulty: ${difficulty}. Use easy|medium|hard` })
    }
    const n = Math.min(Math.max(parseInt(count, 10) || 3, 1), MAX_COUNT)

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = buildPrompt(language, difficulty, n)
    const result = await model.generateContent(prompt)
    const text   = result.response.text().trim()

    const parts = text.split('---SNIPPET---').map((s) => s.trim()).filter(Boolean)

    const snippets = parts.slice(0, n).map((content, i) => ({
      id:         `${language.toLowerCase().replace(/[^a-z0-9]/g, '')}-live-${Date.now()}-${i}`,
      language,
      difficulty,
      content,
    }))

    res.json({ snippets })
  } catch (err) {
    next(err)
  }
}
