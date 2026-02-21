import { Router } from 'express'
import {
  createSession,
  getSessions,
  getLeaderboard,
  getUserLeaderboard,
  getStats,
  getSessionById,
} from '../controllers/sessionController.js'

const router = Router()

// Specific routes before :id
router.get('/leaderboard/users', getUserLeaderboard)
router.get('/leaderboard',       getLeaderboard)
router.get('/stats',             getStats)
router.get('/:id',               getSessionById)
router.get('/',                  getSessions)
router.post('/',                 createSession)

export default router
