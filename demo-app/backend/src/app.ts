import path from 'node:path'
import express from 'express'
import userRoutes from './routes/user'

export function createApp() {
  const app = express()

  // Serve uploaded avatars before API routes so static assets are resolved first
  app.use('/uploads', express.static(path.resolve('uploads')))

  app.use(express.json())
  app.use('/api', userRoutes)

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  return app
}
