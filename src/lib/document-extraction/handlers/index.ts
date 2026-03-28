// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Document Processing Handler Registry
 * Maps job types to their processing functions (strategy pattern)
 */

import type { ProcessingJobType } from "../types"

export interface ProcessingContext {
  jobId: string
  schoolId: string
  userId?: string
  fileUrl: string
  fileName?: string
  mimeType?: string
  metadata: Record<string, unknown>
}

export interface ProcessingResult {
  success: boolean
  data?: unknown
  confidence?: number
  costUsd?: number
  model?: string
  provider?: string
  inputTokens?: number
  outputTokens?: number
  error?: string
  errorCode?: string
}

export type ProcessingHandler = (
  context: ProcessingContext
) => Promise<ProcessingResult>

const handlerRegistry = new Map<string, ProcessingHandler>()

/**
 * Register a handler for a job type
 */
export function registerHandler(
  jobType: ProcessingJobType | string,
  handler: ProcessingHandler
) {
  handlerRegistry.set(jobType, handler)
}

/**
 * Get handler for a job type
 */
export function getHandler(jobType: string): ProcessingHandler | undefined {
  return handlerRegistry.get(jobType)
}

/**
 * Check if a handler is registered
 */
export function hasHandler(jobType: string): boolean {
  return handlerRegistry.has(jobType)
}

/**
 * List all registered job types
 */
export function getRegisteredTypes(): string[] {
  return Array.from(handlerRegistry.keys())
}
