/**
 * Claude Vision Extractor
 * Uses Anthropic Claude for AI-powered document extraction
 * Pattern based on receipt extraction implementation
 */

import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { logger } from '@/lib/logger'
import type { OnboardingStep } from './types'
import { stepSchemaMap } from './schemas'
import { getPromptForStep, systemMessage } from './prompts'

/**
 * Extract structured data from document image using Claude 3.5 Sonnet
 * @param fileUrl - Public URL or base64-encoded image data
 * @param stepId - Onboarding step identifier
 * @returns Extracted structured data
 */
export async function extractWithClaude(
  fileUrl: string,
  stepId: OnboardingStep
) {
  const startTime = Date.now()

  try {
    logger.info('Starting document extraction with Claude', {
      action: 'extract_document_data',
      stepId,
      fileUrl: fileUrl.substring(0, 50) + '...', // Log truncated URL
    })

    // Get the appropriate schema for this step
    const schema = stepSchemaMap[stepId]
    const prompt = getPromptForStep(stepId)

    // Determine if fileUrl is a URL or base64 data
    const isBase64 = fileUrl.startsWith('data:')
    const imageInput = isBase64 ? fileUrl : fileUrl

    // Extract data using Vercel AI SDK with Claude 3.5 Sonnet
    const result = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      schema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: imageInput,
            },
            {
              type: 'text',
              text: `${systemMessage}

${prompt}`,
            },
          ],
        },
      ],
    })

    const processingTime = Date.now() - startTime

    logger.info('Document extraction completed', {
      action: 'extract_document_success',
      stepId,
      processingTime,
      fields: Object.keys(result.object).length,
    })

    return {
      success: true,
      data: result.object,
      processingTime,
    }
  } catch (error) {
    const processingTime = Date.now() - startTime

    logger.error(
      'Document extraction failed',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        action: 'extract_document_error',
        stepId,
        processingTime,
      }
    )

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Extraction failed',
      processingTime,
    }
  }
}

/**
 * Convert File to base64 data URL for Claude Vision API
 * @param file - File object to convert
 * @returns Base64 data URL
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Convert buffer to base64 data URL
 * @param buffer - File buffer
 * @param mimeType - MIME type of the file
 * @returns Base64 data URL
 */
export function bufferToBase64(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64')
  return `data:${mimeType};base64,${base64}`
}
