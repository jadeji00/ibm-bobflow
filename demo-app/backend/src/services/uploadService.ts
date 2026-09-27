import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import type { File } from 'formidable'

// ── types ──────────────────────────────────────────────────────────────────

export type UploadValidationResult =
  | { ok: true; mimeType: string; ext: string }
  | { ok: false; reason: string }

// ── constants ──────────────────────────────────────────────────────────────

const MAX_BYTES = 5 * 1024 * 1024

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

// Magic-byte signatures: [offset, bytes]
const MAGIC: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
}

// Path-traversal indicators to reject in any client-supplied filename
const TRAVERSAL_RE = /(\.\.[/\\]|^\/|^[A-Za-z]:[/\\]|[/\\])/

// ── helpers ────────────────────────────────────────────────────────────────

function readMagicBytes(filepath: string, count: number): Buffer {
  const buf = Buffer.alloc(count)
  const fd = fs.openSync(filepath, 'r')
  try {
    fs.readSync(fd, buf, 0, count, 0)
  } finally {
    fs.closeSync(fd)
  }
  return buf
}

function matchesMagic(filepath: string, mimeType: string): boolean {
  const expected = MAGIC[mimeType]
  if (!expected) return false
  try {
    const actual = readMagicBytes(filepath, expected.length)
    return expected.every((byte, i) => actual[i] === byte)
  } catch {
    return false
  }
}

// ── public API ─────────────────────────────────────────────────────────────

/**
 * Validate a formidable File against all required security controls.
 * Returns ok:true with the confirmed mimeType and extension, or
 * ok:false with a human-readable reason.
 *
 * Checks (in order):
 *  1. Zero-byte rejection
 *  2. Size limit (≤ 5 MB)
 *  3. MIME allow-list
 *  4. Magic-byte verification (Content-Type is attacker-controlled)
 *  5. Extension verification (extension must be consistent with MIME)
 *  6. Path-traversal guard on client filename
 */
export function validateUpload(file: File): UploadValidationResult {
  // 1. Zero-byte
  if (file.size === 0) {
    return { ok: false, reason: 'Empty file is not allowed.' }
  }

  // 2. Size limit (belt-and-suspenders; formidable also enforces maxFileSize)
  if (file.size > MAX_BYTES) {
    return { ok: false, reason: 'File exceeds the 5 MB size limit.' }
  }

  // 3. MIME allow-list
  const mime = file.mimetype ?? ''
  const allowedExt = ALLOWED_MIME[mime]
  if (!allowedExt) {
    return { ok: false, reason: `File type "${mime}" is not allowed. Only JPEG and PNG are accepted.` }
  }

  // 4. Magic-byte check — Content-Type header is attacker-controlled
  if (!matchesMagic(file.filepath, mime)) {
    return { ok: false, reason: 'File content does not match its declared type.' }
  }

  // 5. Extension consistency
  const originalName = file.originalFilename ?? ''
  const dotIdx = originalName.lastIndexOf('.')
  if (dotIdx !== -1) {
    const clientExt = originalName.slice(dotIdx + 1).toLowerCase()
    const validExts = mime === 'image/jpeg' ? ['jpg', 'jpeg'] : ['png']
    if (!validExts.includes(clientExt)) {
      return { ok: false, reason: 'File extension does not match the file content.' }
    }
  }

  // 6. Path-traversal guard
  if (TRAVERSAL_RE.test(originalName)) {
    return { ok: false, reason: 'Filename contains invalid characters or path components.' }
  }

  return { ok: true, mimeType: mime, ext: allowedExt }
}

/**
 * Generate a safe storage filename from the validated MIME type.
 * The client-supplied filename is never used.
 */
export function generateStorageName(mimeType: string): string {
  const ext = ALLOWED_MIME[mimeType] ?? 'bin'
  return `${randomUUID()}.${ext}`
}
