/**
 * Document Extraction API Route
 * POST /api/onboarding/extract
 * Handles AI-powered document extraction for onboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { extractFromDocument } from '@/lib/document-extraction'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Request validation schema
const extractRequestSchema = z.object({
  stepId: z.enum([
    'title',
    'description',
    'location',
    'capacity',
    'branding',
    'import',
    'price',
    'legal',
  ]),
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    logger.info('Document extraction request received', {
      action: 'extract_request',
      userId: session.user.id,
    })

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const stepId = formData.get('stepId') as string | null

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 }
      )
    }

    if (!stepId) {
      return NextResponse.json(
        { success: false, error: 'Step ID is required' },
        { status: 400 }
      )
    }

    // Validate step ID
    const validation = extractRequestSchema.safeParse({ stepId })
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid step ID' },
        { status: 400 }
      )
    }

    // Validate file
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file' },
        { status: 400 }
      )
    }

    logger.info('Processing extraction request', {
      action: 'extract_processing',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      stepId,
      userId: session.user.id,
    })

    // Extract data from document
    const result = await extractFromDocument(
      file,
      validation.data.stepId,
      {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      }
    )

    if (!result.success) {
      logger.warn('Document extraction failed', {
        action: 'extract_failed',
        error: result.error,
        stepId,
        userId: session.user.id,
      })

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Extraction failed',
        },
        { status: 400 }
      )
    }

    logger.info('Document extraction successful', {
      action: 'extract_success',
      stepId,
      fieldsExtracted: result.data?.fields.length || 0,
      confidence: result.data?.confidence,
      processingTime: result.processingTime,
      userId: session.user.id,
    })

    // Return extracted data
    return NextResponse.json({
      success: true,
      data: result.data,
      processingTime: result.processingTime,
    })
  } catch (error) {
    logger.error(
      'Extraction API error',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        action: 'extract_api_error',
      }
    )

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
