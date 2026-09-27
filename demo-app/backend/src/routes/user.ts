import path from 'node:path'
import fs from 'node:fs/promises'
import { Router } from 'express'
import { formidable } from 'formidable'
import { getUser, updateUserAvatar } from '../services/userService'
import { validateUpload, generateStorageName } from '../services/uploadService'

export const CURRENT_USER_ID = 'user-1'

// uploads/ is relative to the cwd of the process (demo-app/)
const UPLOADS_DIR = path.resolve('uploads')

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

router.post('/user/avatar', (req, res) => {
  // Synthesis amendment: enforce size limit at parse time so the payload is
  // never fully written to disk before being rejected.
  const form = formidable({
    maxFiles: 1,
    maxFileSize: 5 * 1024 * 1024,
    allowEmptyFiles: false,
    minFileSize: 1,
    uploadDir: UPLOADS_DIR,
    keepExtensions: false,
  })

  form.parse(req, async (parseErr, _fields, files) => {
    if (parseErr) {
      // formidable throws when maxFileSize is exceeded or allowEmptyFiles fails
      res.status(400).json({ error: parseErr.message })
      return
    }

    const fileEntry = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar
    if (!fileEntry) {
      res.status(400).json({ error: 'No file was uploaded. Use field name "avatar".' })
      return
    }

    const result = validateUpload(fileEntry)
    if (!result.ok) {
      // Clean up the temp file formidable already wrote
      await fs.unlink(fileEntry.filepath).catch(() => undefined)
      res.status(400).json({ error: result.reason })
      return
    }

    const storageName = generateStorageName(result.mimeType)
    const dest = path.join(UPLOADS_DIR, storageName)

    try {
      await fs.rename(fileEntry.filepath, dest)
    } catch {
      // rename can fail across devices (e.g. different tmp partition); fall back to copy+unlink
      await fs.copyFile(fileEntry.filepath, dest)
      await fs.unlink(fileEntry.filepath).catch(() => undefined)
    }

    const avatarUrl = `/uploads/${storageName}`
    updateUserAvatar(CURRENT_USER_ID, avatarUrl)
    res.json({ avatarUrl })
  })
})

export default router
