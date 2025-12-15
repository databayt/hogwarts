/**
 * File Deduplication Utility
 * Provides SHA-256 hashing for file deduplication
 */

import { createHash } from "crypto"

/**
 * Generate SHA-256 hash from file buffer
 * Used for deduplication - identical files will have identical hashes
 */
export async function generateFileHash(buffer: Buffer): Promise<string> {
  const hash = createHash("sha256")
  hash.update(buffer)
  return hash.digest("hex")
}

/**
 * Generate SHA-256 hash from file stream (for large files)
 * More memory-efficient for files >100MB
 */
export async function generateFileHashFromStream(
  stream: ReadableStream<Uint8Array>
): Promise<string> {
  const hash = createHash("sha256")
  const reader = stream.getReader()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      hash.update(Buffer.from(value))
    }
    return hash.digest("hex")
  } finally {
    reader.releaseLock()
  }
}

/**
 * Generate SHA-256 hash from File object (browser)
 * Reads file in chunks to avoid memory issues
 */
export async function generateFileHashFromFile(
  file: File,
  chunkSize = 1024 * 1024 // 1MB chunks
): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256")
    const reader = new FileReader()
    let offset = 0

    reader.onload = (e) => {
      if (e.target?.result) {
        const chunk = Buffer.from(e.target.result as ArrayBuffer)
        hash.update(chunk)

        offset += chunk.length

        if (offset < file.size) {
          readNextChunk()
        } else {
          resolve(hash.digest("hex"))
        }
      }
    }

    reader.onerror = () => reject(reader.error)

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + chunkSize)
      reader.readAsArrayBuffer(slice)
    }

    readNextChunk()
  })
}

/**
 * Generate SHA-256 hash for a chunk (used in chunked uploads)
 */
export function generateChunkHash(chunkBuffer: Buffer): string {
  const hash = createHash("sha256")
  hash.update(chunkBuffer)
  return hash.digest("hex")
}

/**
 * Verify file integrity by comparing hash
 */
export async function verifyFileHash(
  buffer: Buffer,
  expectedHash: string
): Promise<boolean> {
  const actualHash = await generateFileHash(buffer)
  return actualHash === expectedHash
}

/**
 * Generate a unique upload ID for chunked uploads
 * Combines file hash with timestamp for uniqueness
 */
export function generateUploadId(fileHash: string): string {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${fileHash.substring(0, 16)}-${timestamp}-${randomSuffix}`
}
