// Minimal ambient declarations for formidable v3 (no @types/formidable package available).
// Only the surface area used by this project is declared.

declare module 'formidable' {
  import type { IncomingMessage } from 'node:http'

  export interface FormidableOptions {
    maxFiles?: number
    maxFileSize?: number
    maxTotalFileSize?: number
    minFileSize?: number
    allowEmptyFiles?: boolean
    keepExtensions?: boolean
    uploadDir?: string
    encoding?: string
    hashAlgorithm?: string | false
  }

  export interface File {
    /** Path to the temp file on disk */
    filepath: string
    /** Original filename from the client (may be null) */
    originalFilename: string | null
    /** New filename assigned by formidable */
    newFilename: string
    /** MIME type declared by the client */
    mimetype: string | null
    /** Size in bytes */
    size: number
    hashAlgorithm: string | false
    hash: string | null
    lastModifiedDate: Date | null
    toJSON(): Record<string, unknown>
    toString(): string
  }

  export type Fields = Record<string, string | string[]>
  export type Files = Record<string, File | File[]>

  export type ParseCallback = (
    err: Error | null,
    fields: Fields,
    files: Files,
  ) => void

  export interface IncomingForm {
    parse(req: IncomingMessage, callback: ParseCallback): void
  }

  export function formidable(options?: FormidableOptions): IncomingForm
}
