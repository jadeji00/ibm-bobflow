import path from 'node:path'
import fs from 'node:fs/promises'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../backend/src/app'

// ── Minimal magic-byte fixtures ────────────────────────────────────────────

const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]) // SOI + APP0 marker
const PNG_MAGIC  = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) // PNG signature

/** Build a fake JPEG buffer of exactly `size` bytes (valid magic, padded with zeros) */
function makeJpeg(size: number): Buffer {
  const buf = Buffer.alloc(size, 0)
  JPEG_MAGIC.copy(buf)
  return buf
}

/** Build a fake PNG buffer of exactly `size` bytes (valid magic, padded with zeros) */
function makePng(size: number): Buffer {
  const buf = Buffer.alloc(size, 0)
  PNG_MAGIC.copy(buf)
  return buf
}

const UPLOADS_DIR = path.resolve('uploads')

/** Remove all test-generated files from uploads/ after a test suite */
async function cleanUploads(): Promise<void> {
  const entries = await fs.readdir(UPLOADS_DIR)
  await Promise.all(
    entries
      .filter((f) => f !== '.gitkeep')
      .map((f) => fs.unlink(path.join(UPLOADS_DIR, f)).catch(() => undefined)),
  )
}

// ── Existing regression tests ──────────────────────────────────────────────

describe('GET /api/health', () => {
  const app = createApp()

  it('reports the service as available', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})

describe('GET /api/user', () => {
  const app = createApp()

  it('returns the current user profile', async () => {
    const response = await request(app).get('/api/user')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      username: 'Alice',
      email: 'alice@example.com',
      avatarUrl: null,
    })
  })

  it('reports no avatar until one is uploaded', async () => {
    const response = await request(app).get('/api/user')
    expect(response.body.avatarUrl).toBeNull()
  })
})

// ── Avatar upload tests ────────────────────────────────────────────────────

describe('POST /api/user/avatar', () => {
  // Fresh app instance per describe so in-memory state is isolated
  const app = createApp()

  afterAll(cleanUploads)

  // ── Positive cases ───────────────────────────────────────────────────────

  it('accepts a valid JPEG ≤ 5 MB', async () => {
    const response = await request(app)
      .post('/api/user/avatar')
      .attach('avatar', makeJpeg(1024), { filename: 'photo.jpg', contentType: 'image/jpeg' })

    expect(response.status).toBe(200)
    expect(typeof response.body.avatarUrl).toBe('string')
    expect(response.body.avatarUrl).toMatch(/^\/uploads\/.+\.jpg$/)
  })

  it('accepts a valid PNG ≤ 5 MB', async () => {
    const response = await request(app)
      .post('/api/user/avatar')
      .attach('avatar', makePng(1024), { filename: 'photo.png', contentType: 'image/png' })

    expect(response.status).toBe(200)
    expect(response.body.avatarUrl).toMatch(/^\/uploads\/.+\.png$/)
  })

  // ── Regression: GET /api/user reflects the uploaded avatarUrl ────────────

  it('GET /api/user returns the updated avatarUrl after a successful upload', async () => {
    // Use a dedicated app instance to avoid state from sibling tests
    const isolatedApp = createApp()

    const upload = await request(isolatedApp)
      .post('/api/user/avatar')
      .attach('avatar', makeJpeg(512), { filename: 'avatar.jpg', contentType: 'image/jpeg' })

    expect(upload.status).toBe(200)
    const { avatarUrl } = upload.body as { avatarUrl: string }

    const profile = await request(isolatedApp).get('/api/user')
    expect(profile.status).toBe(200)
    expect(profile.body.avatarUrl).toBe(avatarUrl)
  })

  // ── Negative — size ──────────────────────────────────────────────────────

  it('rejects a JPEG exceeding 5 MB', async () => {
    const response = await request(app)
      .post('/api/user/avatar')
      .attach('avatar', makeJpeg(5 * 1024 * 1024 + 1), { filename: 'big.jpg', contentType: 'image/jpeg' })

    expect(response.status).toBe(400)
  })

  it('rejects a PNG exceeding 5 MB', async () => {
    const response = await request(app)
      .post('/api/user/avatar')
      .attach('avatar', makePng(5 * 1024 * 1024 + 1), { filename: 'big.png', contentType: 'image/png' })

    expect(response.status).toBe(400)
  })

  // ── Negative — wrong type ────────────────────────────────────────────────

  it('rejects a TXT file', async () => {
    const response = await request(app)
      .post('/api/user/avatar')
      .attach('avatar', Buffer.from('hello world'), { filename: 'note.txt', contentType: 'text/plain' })

    expect(response.status).toBe(400)
  })

  it('rejects a PDF file', async () => {
    const pdfHeader = Buffer.from('%PDF-1.4')
    const response = await request(app)
      .post('/api/user/avatar')
      .attach('avatar', pdfHeader, { filename: 'doc.pdf', contentType: 'application/pdf' })

    expect(response.status).toBe(400)
  })

  it('rejects an empty file', async () => {
    const response = await request(app)
      .post('/api/user/avatar')
      .attach('avatar', Buffer.alloc(0), { filename: 'empty.jpg', contentType: 'image/jpeg' })

    expect(response.status).toBe(400)
  })

  it('rejects a MIME type that is not in the allow-list', async () => {
    // Valid JPEG magic but declared as image/gif
    const response = await request(app)
      .post('/api/user/avatar')
      .attach('avatar', makeJpeg(512), { filename: 'photo.gif', contentType: 'image/gif' })

    expect(response.status).toBe(400)
  })

  // ── Security ─────────────────────────────────────────────────────────────

  it('rejects a filename containing path traversal (raw HTTP, bypasses superagent normalisation)', async () => {
    // superagent strips directory separators from filenames before sending, so
    // '../../etc/passwd.jpg' would arrive as 'passwd.jpg'. We test the server's
    // traversal guard with a raw Buffer payload instead.
    const boundary = 'BobFlowBoundary'
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="avatar"; filename="../../etc/passwd.jpg"\r\n` +
        `Content-Type: image/jpeg\r\n` +
        `\r\n`,
      ),
      makeJpeg(512),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ])

    const response = await request(app)
      .post('/api/user/avatar')
      .set('Content-Type', `multipart/form-data; boundary=${boundary}`)
      .send(body)

    expect(response.status).toBe(400)
  })

  it('rejects a spoofed extension (TXT content renamed to .jpg)', async () => {
    // No valid JPEG magic bytes — just plain text content with a .jpg name
    const response = await request(app)
      .post('/api/user/avatar')
      .attach('avatar', Buffer.from('this is not an image'), { filename: 'evil.jpg', contentType: 'image/jpeg' })

    expect(response.status).toBe(400)
  })
})

// ── Uploaded-file cleanup for isolated app tests ───────────────────────────

describe('POST /api/user/avatar — isolated cleanup', () => {
  beforeAll(cleanUploads)
  afterAll(cleanUploads)

  it('stores the file in uploads/ under a generated name (not the client filename)', async () => {
    const app = createApp()
    const clientFilename = 'myspecialphoto.jpg'

    const response = await request(app)
      .post('/api/user/avatar')
      .attach('avatar', makeJpeg(512), { filename: clientFilename, contentType: 'image/jpeg' })

    expect(response.status).toBe(200)
    const storedName = path.basename(response.body.avatarUrl as string)
    expect(storedName).not.toBe(clientFilename)
    // UUID v4 pattern: 8-4-4-4-12 hex chars
    expect(storedName).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/)
  })
})
