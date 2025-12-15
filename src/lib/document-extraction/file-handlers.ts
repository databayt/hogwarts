/**
 * File Handlers for Document Extraction
 * Handles parsing of CSV, Excel, PDF, and Word documents
 */

import { logger } from '@/lib/logger'

// === CSV HANDLER ===

export async function parseCSV(content: string): Promise<{
  success: boolean
  text?: string
  error?: string
}> {
  try {
    // Use papaparse for CSV parsing
    const Papa = await import('papaparse')

    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    })

    if (result.errors.length > 0) {
      logger.warn('CSV parsing warnings', { errors: result.errors })
    }

    // Convert parsed data to readable text format
    const text = convertParsedDataToText(result.data as Record<string, unknown>[])

    return {
      success: true,
      text,
    }
  } catch (error) {
    logger.error('Failed to parse CSV', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'CSV parsing failed',
    }
  }
}

// === EXCEL HANDLER ===

export async function parseExcel(
  buffer: ArrayBuffer
): Promise<{
  success: boolean
  text?: string
  error?: string
}> {
  try {
    const XLSX = await import('xlsx')

    // Read workbook
    const workbook = XLSX.read(buffer, { type: 'array' })

    // Extract text from all sheets
    const textParts: string[] = []

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        defval: '',
      }) as string[][]

      // Add sheet name as header
      textParts.push(`Sheet: ${sheetName}`)
      textParts.push('-'.repeat(50))

      // Convert to readable text
      if (jsonData.length > 0) {
        const headers = jsonData[0]
        const rows = jsonData.slice(1)

        rows.forEach((row) => {
          const rowText = headers
            .map((header, i) => `${header}: ${row[i] || ''}`)
            .filter((text) => text.split(':')[1].trim() !== '')
            .join(', ')

          if (rowText) {
            textParts.push(rowText)
          }
        })
      }

      textParts.push('') // Empty line between sheets
    })

    return {
      success: true,
      text: textParts.join('\n'),
    }
  } catch (error) {
    logger.error('Failed to parse Excel', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Excel parsing failed',
    }
  }
}

// === PDF HANDLER ===

export async function parsePDF(
  buffer: Buffer
): Promise<{
  success: boolean
  text?: string
  error?: string
}> {
  try {
    // pdf-parse is a CommonJS module, we need to access it differently
    const pdfParseModule = await import('pdf-parse')
    const pdfParse = (pdfParseModule as any).default || pdfParseModule

    const data = await pdfParse(buffer)

    return {
      success: true,
      text: data.text,
    }
  } catch (error) {
    logger.error('Failed to parse PDF', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PDF parsing failed',
    }
  }
}

// === WORD HANDLER ===

export async function parseWord(
  buffer: Buffer
): Promise<{
  success: boolean
  text?: string
  html?: string
  error?: string
}> {
  try {
    const mammoth = await import('mammoth')

    const result = await mammoth.extractRawText({ buffer })

    if (result.messages.length > 0) {
      logger.warn('Word parsing warnings', { messages: result.messages })
    }

    return {
      success: true,
      text: result.value,
    }
  } catch (error) {
    logger.error('Failed to parse Word document', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Word parsing failed',
    }
  }
}

// === IMAGE HANDLER ===

export async function handleImage(
  buffer: Buffer,
  mimeType: string
): Promise<{
  success: boolean
  base64?: string
  error?: string
}> {
  try {
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64}`

    return {
      success: true,
      base64: dataUrl,
    }
  } catch (error) {
    logger.error('Failed to process image', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image processing failed',
    }
  }
}

// === HELPER FUNCTIONS ===

function convertParsedDataToText(data: Record<string, unknown>[]): string {
  const lines: string[] = []

  data.forEach((row, index) => {
    const rowText = Object.entries(row)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')

    if (rowText) {
      lines.push(`Row ${index + 1}: ${rowText}`)
    }
  })

  return lines.join('\n')
}

// === FILE TYPE DETECTION ===

export interface FileInfo {
  type: 'csv' | 'excel' | 'pdf' | 'word' | 'image' | 'unknown'
  mimeType: string
  extension: string
}

export function detectFileType(filename: string, mimeType: string): FileInfo {
  const extension = filename.split('.').pop()?.toLowerCase() || ''

  // CSV
  if (mimeType === 'text/csv' || extension === 'csv') {
    return { type: 'csv', mimeType, extension }
  }

  // Excel
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    extension === 'xls' ||
    extension === 'xlsx'
  ) {
    return { type: 'excel', mimeType, extension }
  }

  // PDF
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return { type: 'pdf', mimeType, extension }
  }

  // Word
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === 'doc' ||
    extension === 'docx'
  ) {
    return { type: 'word', mimeType, extension }
  }

  // Images
  if (
    mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)
  ) {
    return { type: 'image', mimeType, extension }
  }

  return { type: 'unknown', mimeType, extension }
}

// === FILE VALIDATION ===

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateFile(
  file: { name: string; size: number; type: string },
  options?: {
    maxSize?: number // in bytes
    allowedTypes?: string[]
  }
): ValidationResult {
  const maxSize = options?.maxSize || 10 * 1024 * 1024 // 10MB default
  const allowedTypes = options?.allowedTypes || [
    'csv',
    'excel',
    'pdf',
    'word',
    'image',
  ]

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
    }
  }

  // Check file type
  const fileInfo = detectFileType(file.name, file.type)

  if (fileInfo.type === 'unknown') {
    return {
      valid: false,
      error: 'Unsupported file type',
    }
  }

  if (!allowedTypes.includes(fileInfo.type)) {
    return {
      valid: false,
      error: `File type ${fileInfo.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}
