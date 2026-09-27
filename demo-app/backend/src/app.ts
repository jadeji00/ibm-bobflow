import express from 'express'
import userRoutes from './routes/user'

export function createApp() {
  const app = express()

  app.use(express.json())
  app.use('/api', userRoutes)

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  return app
}
