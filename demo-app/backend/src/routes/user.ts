import { Router } from 'express'
import { getUser } from '../services/userService'

export const CURRENT_USER_ID = 'user-1'

const router = Router()

router.get('/user', (_req, res) => {
  const user = getUser(CURRENT_USER_ID)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
  })
})

export default router
