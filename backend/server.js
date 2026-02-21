import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

import app from './src/app.js'
import { connectDB } from './src/config/db.js'

const PORT = process.env.PORT || 5000

async function start() {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`[server] typing-dev-api running on http://localhost:${PORT}`)
    console.log(`[server] NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
  })
}

start()
