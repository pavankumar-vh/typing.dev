import { Router } from 'express'
import { Challenge } from '../models/Challenge.js'

const router = Router()

// Create a challenge notification
router.post('/', async (req, res, next) => {
  try {
    const { fromUserId, fromDisplayName, toUserId, roomCode } = req.body
    if (!fromUserId || !toUserId || !roomCode) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    // Expire any previous pending challenges from this user to same target
    await Challenge.updateMany(
      { fromUserId, toUserId, status: 'pending' },
      { status: 'expired' }
    )

    const challenge = await Challenge.create({
      fromUserId,
      fromDisplayName: fromDisplayName || 'anonymous',
      toUserId,
      roomCode,
    })

    res.status(201).json({ success: true, data: challenge })
  } catch (err) {
    next(err)
  }
})

// Get pending challenges for a user
router.get('/:userId', async (req, res, next) => {
  try {
    const challenges = await Challenge.find({
      toUserId: req.params.userId,
      status: 'pending',
    }).sort({ createdAt: -1 }).limit(10)

    res.json({ success: true, data: challenges })
  } catch (err) {
    next(err)
  }
})

// Accept / decline a challenge
router.patch('/:id', async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' })
    }
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    if (!challenge) return res.status(404).json({ success: false, error: 'Challenge not found' })
    res.json({ success: true, data: challenge })
  } catch (err) {
    next(err)
  }
})

export default router
