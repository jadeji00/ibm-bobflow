import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { describe, it, expect, afterEach } from 'vitest'
import { validateUpload, generateStorageName } from '../backend/src/services/uploadService'
import type { File as FormidableFile } from 'formidable'

// ── helpers ────────────────────────────────────────────────────────────────

const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
const PNG_MAGIC  = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const tempFiles: string[] = []

function makeTempFile(content: Buffer): string {
  const p = path.join(os.tmpdir(), `upload-test-${Date.now()}-${Math.random()}`)
  fs.writeFileSync(p, content)
  tempFiles.push(p)
  return p
}

function fakeFile(opts: {
  filepath: string
  size: number
  mimetype: string
  originalFilename: string
}): FormidableFile {
  return {
    filepath: opts.filepath,
    size: opts.size,
    mimetype: opts.mimetype,
    originalFilename: opts.originalFilename,
    // Required by formidable File type but unused by validateUpload:
    newFilename: '',
    hashAlgorithm: false,
    hash: null,
    lastModifiedDate: null,
    toJSON: () => ({}),
    toString: () => '[File]',
  } as unknown as FormidableFile
}

afterEach(() => {
  for (const p of tempFiles.splice(0)) {
    try { fs.unlinkSync(p) } catch { /* already gone */ }
  }
})

// ── validateUpload ─────────────────────────────────────────────────────────

describe('validateUpload', () => {
  it('accepts a valid JPEG', () => {
    const fp = makeTempFile(Buffer.concat([JPEG_MAGIC, Buffer.alloc(100)]))
    const result = validateUpload(fakeFile({ filepath: fp, size: 106, mimetype: 'image/jpeg', originalFilename: 'photo.jpg' }))
    expect(result.ok).toBe(true)
  })

  it('accepts a valid PNG', () => {
    const fp = makeTempFile(Buffer.concat([PNG_MAGIC, Buffer.alloc(100)]))
    const result = validateUpload(fakeFile({ filepath: fp, size: 108, mimetype: 'image/png', originalFilename: 'photo.png' }))
    expect(result.ok).toBe(true)
  })

  it('rejects zero-byte file', () => {
    const fp = makeTempFile(Buffer.alloc(0))
    const result = validateUpload(fakeFile({ filepath: fp, size: 0, mimetype: 'image/jpeg', originalFilename: 'empty.jpg' }))
    expect(result.ok).toBe(false)
  })

  it('rejects file exceeding 5 MB', () => {
    const big = Buffer.concat([JPEG_MAGIC, Buffer.alloc(5 * 1024 * 1024)])
    const fp = makeTempFile(big)
    const result = validateUpload(fakeFile({ filepath: fp, size: big.length, mimetype: 'image/jpeg', originalFilename: 'big.jpg' }))
    expect(result.ok).toBe(false)
  })

  it('rejects disallowed MIME type', () => {
    const fp = makeTempFile(Buffer.from('%PDF-1.4'))
    const result = validateUpload(fakeFile({ filepath: fp, size: 8, mimetype: 'application/pdf', originalFilename: 'doc.pdf' }))
    expect(result.ok).toBe(false)
  })

  it('rejects spoofed extension — plain text with .jpg name', () => {
    const fp = makeTempFile(Buffer.from('this is not an image at all'))
    const result = validateUpload(fakeFile({ filepath: fp, size: 27, mimetype: 'image/jpeg', originalFilename: 'evil.jpg' }))
    expect(result.ok).toBe(false)
  })

  it('rejects filename containing path traversal (../ sequence)', () => {
    const fp = makeTempFile(Buffer.concat([JPEG_MAGIC, Buffer.alloc(100)]))
    const result = validateUpload(fakeFile({ filepath: fp, size: 106, mimetype: 'image/jpeg', originalFilename: '../../etc/passwd.jpg' }))
    expect(result.ok).toBe(false)
  })

  it('rejects filename containing forward slash', () => {
    const fp = makeTempFile(Buffer.concat([JPEG_MAGIC, Buffer.alloc(100)]))
    const result = validateUpload(fakeFile({ filepath: fp, size: 106, mimetype: 'image/jpeg', originalFilename: 'subdir/photo.jpg' }))
    expect(result.ok).toBe(false)
  })

  it('rejects extension inconsistent with MIME (PNG magic declared as JPEG with .png name) — step 4 fires', () => {
    // Content: PNG magic. MIME: image/jpeg. Step 4 fails because PNG bytes ≠ JPEG magic.
    // This does NOT exercise step 5 — it exits at step 4.
    const fp = makeTempFile(Buffer.concat([PNG_MAGIC, Buffer.alloc(100)]))
    const result = validateUpload(fakeFile({ filepath: fp, size: 108, mimetype: 'image/jpeg', originalFilename: 'photo.png' }))
    expect(result.ok).toBe(false)
  })

  it('rejects mismatched extension — valid JPEG content, mimetype image/jpeg, filename photo.png — step 5 fires', () => {
    // Content: valid JPEG magic (steps 1-4 all pass).
    // MIME: image/jpeg (step 3 passes, step 4 passes).
    // Filename extension: .png, which is not in ['jpg','jpeg'] for image/jpeg → step 5 must fire.
    const fp = makeTempFile(Buffer.concat([JPEG_MAGIC, Buffer.alloc(100)]))
    const result = validateUpload(fakeFile({ filepath: fp, size: 106, mimetype: 'image/jpeg', originalFilename: 'photo.png' }))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain('extension')
    }
  })
})

// ── generateStorageName ────────────────────────────────────────────────────

describe('generateStorageName', () => {
  it('returns a UUID-based name for image/jpeg', () => {
    const name = generateStorageName('image/jpeg')
    expect(name).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/)
  })

  it('returns a UUID-based name for image/png', () => {
    const name = generateStorageName('image/png')
    expect(name).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/)
  })

  it('never returns the same name twice', () => {
    expect(generateStorageName('image/jpeg')).not.toBe(generateStorageName('image/jpeg'))
  })
})
