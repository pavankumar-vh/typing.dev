import mongoose from 'mongoose'

const challengeSchema = new mongoose.Schema(
  {
    fromUserId:    { type: String, required: true },
    fromDisplayName: { type: String, required: true },
    toUserId:      { type: String, required: true },
    roomCode:      { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'declined'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

// Auto-expire after 5 minutes
challengeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 })
challengeSchema.index({ toUserId: 1, status: 1 })

export const Challenge = mongoose.model('Challenge', challengeSchema)
