import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables')
  }

  try {
    const conn = await mongoose.connect(uri)
    console.log(`[db] MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error(`[db] Connection failed: ${err.message}`)
    process.exit(1)
  }
}
