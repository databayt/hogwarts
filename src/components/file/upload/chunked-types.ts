/**
 * Chunked Upload Types
 * Type definitions for large file uploads
 */

export interface InitiateChunkedUploadInput {
  filename: string
  mimeType: string
  totalSize: number
  totalChunks: number
  folder?: string
  accessLevel?: "PUBLIC" | "PRIVATE" | "SCHOOL"
}

export interface InitiateChunkedUploadResult {
  success: boolean
  uploadId?: string
  sessionId?: string
  error?: string
}

export interface UploadChunkInput {
  uploadId: string
  chunkNumber: number
  chunkData: string // Base64 encoded
  chunkHash: string
}

export interface UploadChunkResult {
  success: boolean
  progress?: number // 0-100
  uploadedChunks?: number
  totalChunks?: number
  error?: string
}

export interface CompleteChunkedUploadInput {
  uploadId: string
  finalHash: string
}

export interface CompleteChunkedUploadResult {
  success: boolean
  fileId?: string
  url?: string
  cdnUrl?: string
  error?: string
}

export interface GetUploadStatusInput {
  uploadId: string
}

export interface GetUploadStatusResult {
  success: boolean
  status?: "pending" | "uploading" | "completed" | "failed" | "aborted"
  progress?: number
  uploadedChunks?: number
  totalChunks?: number
  error?: string
}

export interface ChunkedUploadOptions {
  chunkSize?: number // Default 5MB
  maxRetries?: number // Default 3
  retryDelay?: number // Default 1000ms
  onProgress?: (filename: string, progress: number) => void
  onSuccess?: (fileId: string) => void
  onError?: (error: string) => void
}

export interface UploadProgress {
  [filename: string]: {
    progress: number
    speed: number // bytes per second
    eta: number // seconds remaining
    status: "pending" | "uploading" | "paused" | "completed" | "failed"
    error?: string
  }
}
