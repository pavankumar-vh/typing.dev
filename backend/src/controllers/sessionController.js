import { Session } from '../models/Session.js'

// ── POST /api/sessions ────────────────────────────────────
export async function createSession(req, res, next) {
  try {
    const {
      language, duration, wpm, rawWpm, accuracy, errors, snippetId,
      userId, displayName,
    } = req.body

    const session = await Session.create({
      language, duration, wpm, rawWpm, accuracy, errors, snippetId,
      userId:      userId      || null,
      displayName: displayName || 'anonymous',
    })

    res.status(201).json({ success: true, data: session })
  } catch (err) {
    next(err)
  }
}

// ── GET /api/sessions ─────────────────────────────────────
export async function getSessions(req, res, next) {
  try {
    const { language, limit = 50, sort = 'newest', userId } = req.query

    const filter = {}
    if (language) filter.language = language.toLowerCase()
    if (userId)   filter.userId   = userId

    const sortOrder = sort === 'top' ? { wpm: -1 } : { createdAt: -1 }

    const sessions = await Session.find(filter)
      .sort(sortOrder)
      .limit(Number(limit))
      .lean()

    res.json({ success: true, count: sessions.length, data: sessions })
  } catch (err) {
    next(err)
  }
}

// ── GET /api/sessions/leaderboard ────────────────────────
// Top 10 WPM per language (includes displayName)
export async function getLeaderboard(req, res, next) {
  try {
    const languages = ['javascript', 'python', 'java']

    const leaderboard = await Promise.all(
      languages.map(async (lang) => {
        const top = await Session.find({ language: lang })
          .sort({ wpm: -1 })
          .limit(10)
          .select('wpm rawWpm accuracy errors duration snippetId createdAt userId displayName')
          .lean()
        return { language: lang, entries: top }
      })
    )

    res.json({ success: true, data: leaderboard })
  } catch (err) {
    next(err)
  }
}

// ── GET /api/sessions/leaderboard/users ──────────────────
// Global user leaderboard: best WPM per user
export async function getUserLeaderboard(req, res, next) {
  try {
    const { language } = req.query

    const pipeline = [
      ...(language ? [{ $match: { language: language.toLowerCase() } }] : []),
      {
        $sort: { wpm: -1 },
      },
      {
        $group: {
          _id: { $ifNull: ['$userId', { $toString: '$_id' }] },
          displayName:   { $first: '$displayName' },
          userId:        { $first: '$userId' },
          topWpm:        { $max: '$wpm' },
          avgWpm:        { $avg: '$wpm' },
          avgAccuracy:   { $avg: '$accuracy' },
          totalSessions: { $sum: 1 },
          topLanguage:   { $first: '$language' },
        },
      },
      {
        $project: {
          _id: 0,
          userId: 1,
          displayName: 1,
          topWpm: 1,
          avgWpm:      { $round: ['$avgWpm', 1] },
          avgAccuracy: { $round: ['$avgAccuracy', 1] },
          totalSessions: 1,
          topLanguage: 1,
        },
      },
      { $sort: { topWpm: -1 } },
      { $limit: 50 },
    ]

    const data = await Session.aggregate(pipeline)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

// ── GET /api/sessions/stats ───────────────────────────────
// Pass ?userId= to filter to a specific user
export async function getStats(req, res, next) {
  try {
    const { userId } = req.query
    const matchStage = userId ? [{ $match: { userId } }] : []

    const [stats, global] = await Promise.all([
      Session.aggregate([
        ...matchStage,
        {
          $group: {
            _id: '$language',
            totalSessions: { $sum: 1 },
            avgWpm:     { $avg: '$wpm' },
            avgRawWpm:  { $avg: '$rawWpm' },
            avgAccuracy:{ $avg: '$accuracy' },
            avgErrors:  { $avg: '$errors' },
            topWpm:     { $max: '$wpm' },
          },
        },
        {
          $project: {
            language: '$_id', _id: 0,
            totalSessions: 1,
            avgWpm:      { $round: ['$avgWpm', 1] },
            avgRawWpm:   { $round: ['$avgRawWpm', 1] },
            avgAccuracy: { $round: ['$avgAccuracy', 1] },
            avgErrors:   { $round: ['$avgErrors', 1] },
            topWpm: 1,
          },
        },
        { $sort: { avgWpm: -1 } },
      ]),
      Session.aggregate([
        ...matchStage,
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            avgWpm:      { $avg: '$wpm' },
            avgAccuracy: { $avg: '$accuracy' },
            topWpm:      { $max: '$wpm' },
          },
        },
        {
          $project: {
            _id: 0,
            totalSessions: 1,
            avgWpm:      { $round: ['$avgWpm', 1] },
            avgAccuracy: { $round: ['$avgAccuracy', 1] },
            topWpm: 1,
          },
        },
      ]),
    ])

    res.json({
      success: true,
      data: {
        global: global[0] || { totalSessions: 0, avgWpm: 0, avgAccuracy: 0, topWpm: 0 },
        byLanguage: stats,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ── GET /api/sessions/:id ────────────────────────────────
export async function getSessionById(req, res, next) {
  try {
    const session = await Session.findById(req.params.id).lean()
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' })
    res.json({ success: true, data: session })
  } catch (err) {
    next(err)
  }
}

