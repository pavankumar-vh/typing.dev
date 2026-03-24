import mongoose from 'mongoose'

const playerSchema = new mongoose.Schema({
  userId:      { type: String, required: true },
  displayName: { type: String, default: 'anonymous' },
  wpm:         { type: Number, default: 0 },
  rawWpm:      { type: Number, default: 0 },
  accuracy:    { type: Number, default: 0 },
  errors:      { type: Number, default: 0 },
  progress:    { type: Number, default: 0 },   // 0-100
  finished:    { type: Boolean, default: false },
  finishedAt:  { type: Date, default: null },
}, { _id: false })

const battleSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    snippet: {
      language:   { type: String, required: true },
      difficulty: { type: String, default: 'medium' },
      content:    { type: String, required: true },
    },
    duration: {
      type: Number,
      default: 60,
    },
    players: {
      type: [playerSchema],
      validate: [arr => arr.length <= 2, 'Maximum 2 players'],
    },
    status: {
      type: String,
      enum: ['waiting', 'countdown', 'active', 'finished'],
      default: 'waiting',
    },
    winnerId: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

// Clean up stale rooms after 30 minutes
battleSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 })

export const Battle = mongoose.model('Battle', battleSchema)
