import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      required: true,
      enum: ['javascript', 'python', 'java'],
      lowercase: true,
    },
    duration: {
      type: Number,
      required: true,
      enum: [15, 30, 60, 120],
    },
    wpm: {
      type: Number,
      required: true,
      min: 0,
    },
    rawWpm: {
      type: Number,
      required: true,
      min: 0,
    },
    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    errors: {
      type: Number,
      required: true,
      min: 0,
    },
    snippetId: {
      type: String,
      required: true,
    },
    // ── Auth fields (optional — set when user is logged in) ──
    userId: {
      type: String,
      default: null,
      index: true,
    },
    displayName: {
      type: String,
      default: 'anonymous',
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
    suppressReservedKeysWarning: true,
  }
)

// Index for leaderboard and filtering queries
sessionSchema.index({ language: 1, wpm: -1 })
sessionSchema.index({ userId: 1, createdAt: -1 })
sessionSchema.index({ createdAt: -1 })

export const Session = mongoose.model('Session', sessionSchema)
