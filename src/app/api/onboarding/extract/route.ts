/**
 * Document Extraction API - AI-Powered Form Filling
 *
 * Extracts structured data from uploaded documents using AI/OCR.
 *
 * USE CASES:
 * - School registration: Extract info from license documents
 * - Student import: Parse enrollment forms
 * - Legal setup: Extract terms from contracts
 *
 * SUPPORTED STEPS:
 * - title: School name from letterhead
 * - description: About text from brochures
 * - location: Address from official documents
 * - capacity: Student/staff counts from reports
 * - branding: Colors/logos from marketing materials
 * - import: Student/teacher data from rosters
 * - price: Fee structures from pricing sheets
 * - legal: Terms from legal documents
 *
 * WHY AI EXTRACTION:
 * - Reduces manual data entry (tedious, error-prone)
 * - Supports Arabic documents (OCR + translation)
 * - Handles various document formats
 *
 * FILE LIMITS:
 * - Max size: 10MB
 * - Formats: JPEG, PNG, WebP, PDF
 *
 * RESPONSE FORMAT:
 * - success: boolean
 * - data.fields: Extracted key-value pairs
 * - data.confidence: AI confidence score (0-1)
 * - processingTime: Milliseconds for extraction
 *
 * GOTCHAS:
 * - PDF extraction slower than images
 * - Handwritten text has lower accuracy
 * - Arabic requires RTL-aware processing
 * - Large PDFs may timeout (process pages separately)
 *
 * @see /lib/document-extraction.ts for AI implementation
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
