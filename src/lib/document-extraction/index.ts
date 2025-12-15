/**
 * Document Extraction Service
 * Main entry point for AI-powered document extraction
 */

import { logger } from "@/lib/logger"

import { extractWithClaude } from "./claude-extractor"
import {
  detectFileType,
  handleImage,
  parseCSV,
  parseExcel,
  parsePDF,
  parseWord,
  validateFile,
} from "./file-handlers"
import type {
  ExtractedField,
  ExtractionOptions,
  ExtractionResult,
  OnboardingStep,
} from "./types"

/**
 * Extract structured data from document
 * @param file - File to extract data from
 * @param stepId - Onboarding step identifier
 * @param options - Extraction options
 * @returns Extraction result with structured data
 */
export async function extractFromDocument(
  file: File,
  stepId: OnboardingStep,
  options?: ExtractionOptions
): Promise<ExtractionResult> {
  const startTime = Date.now()

  try {
    logger.info("Starting document extraction", {
      action: "extract_document_start",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      stepId,
    })

    // Validate file
    const validation = validateFile(file, options)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        processingTime: Date.now() - startTime,
      }
    }

    // Detect file type
    const fileInfo = detectFileType(file.name, file.type)

    logger.info("File type detected", {
      action: "file_type_detected",
      fileType: fileInfo.type,
      mimeType: fileInfo.mimeType,
    })

    // Process based on file type
    let extractionInput: string | undefined
    let rawText: string | undefined

    switch (fileInfo.type) {
      case "image": {
        // For images, convert to base64 and use Claude Vision directly
        const buffer = Buffer.from(await file.arrayBuffer())
        const imageResult = await handleImage(buffer, fileInfo.mimeType)

        if (!imageResult.success || !imageResult.base64) {
          return {
            success: false,
            error: imageResult.error || "Failed to process image",
            processingTime: Date.now() - startTime,
          }
        }

        extractionInput = imageResult.base64
        break
      }

      case "pdf": {
        // Extract text from PDF, then use Claude to structure it
        const buffer = Buffer.from(await file.arrayBuffer())
        const pdfResult = await parsePDF(buffer)

        if (!pdfResult.success || !pdfResult.text) {
          return {
            success: false,
            error: pdfResult.error || "Failed to parse PDF",
            processingTime: Date.now() - startTime,
          }
        }

        rawText = pdfResult.text
        // For PDFs, we could either use text or convert first page to image
        // For now, we'll use the image approach for better accuracy
        const imageResult = await handleImage(buffer, fileInfo.mimeType)
        extractionInput = imageResult.base64 || pdfResult.text
        break
      }

      case "word": {
        // Extract text from Word document
        const buffer = Buffer.from(await file.arrayBuffer())
        const wordResult = await parseWord(buffer)

        if (!wordResult.success || !wordResult.text) {
          return {
            success: false,
            error: wordResult.error || "Failed to parse Word document",
            processingTime: Date.now() - startTime,
          }
        }

        rawText = wordResult.text
        extractionInput = wordResult.text
        break
      }

      case "excel": {
        // Parse Excel to text
        const buffer = await file.arrayBuffer()
        const excelResult = await parseExcel(buffer)

        if (!excelResult.success || !excelResult.text) {
          return {
            success: false,
            error: excelResult.error || "Failed to parse Excel",
            processingTime: Date.now() - startTime,
          }
        }

        rawText = excelResult.text
        extractionInput = excelResult.text
        break
      }

      case "csv": {
        // Parse CSV to text
        const content = await file.text()
        const csvResult = await parseCSV(content)

        if (!csvResult.success || !csvResult.text) {
          return {
            success: false,
            error: csvResult.error || "Failed to parse CSV",
            processingTime: Date.now() - startTime,
          }
        }

        rawText = csvResult.text
        extractionInput = csvResult.text
        break
      }

      default:
        return {
          success: false,
          error: "Unsupported file type",
          processingTime: Date.now() - startTime,
        }
    }

    if (!extractionInput) {
      return {
        success: false,
        error: "Failed to prepare extraction input",
        processingTime: Date.now() - startTime,
      }
    }

    // Use Claude to extract structured data
    const claudeResult = await extractWithClaude(extractionInput, stepId)

    if (!claudeResult.success || !claudeResult.data) {
      return {
        success: false,
        error: claudeResult.error || "Extraction failed",
        processingTime: Date.now() - startTime,
      }
    }

    // Convert extracted data to ExtractedField format
    const fields: ExtractedField[] = Object.entries(claudeResult.data)
      .filter(
        ([, value]) => value !== null && value !== undefined && value !== ""
      )
      .map(([key, value]) => ({
        key,
        value,
        confidence: determineConfidence(value, rawText),
        source: fileInfo.type,
      }))

    // Calculate overall confidence
    const confidence = calculateOverallConfidence(fields)

    const processingTime = Date.now() - startTime

    logger.info("Document extraction completed", {
      action: "extract_document_success",
      stepId,
      fieldsExtracted: fields.length,
      confidence,
      processingTime,
    })

    return {
      success: true,
      data: {
        fields,
        rawText,
        documentType: fileInfo.type,
        confidence,
      },
      processingTime,
    }
  } catch (error) {
    const processingTime = Date.now() - startTime

    logger.error(
      "Document extraction failed",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "extract_document_error",
        fileName: file.name,
        stepId,
        processingTime,
      }
    )

    return {
      success: false,
      error: error instanceof Error ? error.message : "Extraction failed",
      processingTime,
    }
  }
}

// === HELPER FUNCTIONS ===

/**
 * Determine confidence level for extracted value
 */
function determineConfidence(
  value: unknown,
  rawText?: string
): "high" | "medium" | "low" {
  // If we have raw text and can verify the value exists in it
  if (rawText && typeof value === "string") {
    if (rawText.includes(value)) {
      return "high"
    }
    return "medium"
  }

  // For structured data (arrays, objects)
  if (Array.isArray(value) && value.length > 0) {
    return "high"
  }

  // For numbers and booleans
  if (typeof value === "number" || typeof value === "boolean") {
    return "high"
  }

  // For short strings (likely extracted values)
  if (typeof value === "string" && value.length > 0 && value.length < 200) {
    return "high"
  }

  // For longer text (descriptions, etc.)
  if (typeof value === "string" && value.length >= 200) {
    return "medium"
  }

  return "low"
}

/**
 * Calculate overall confidence score
 */
function calculateOverallConfidence(fields: ExtractedField[]): number {
  if (fields.length === 0) return 0

  const confidenceScores = {
    high: 1.0,
    medium: 0.6,
    low: 0.3,
  }

  const totalScore = fields.reduce(
    (sum, field) => sum + confidenceScores[field.confidence],
    0
  )

  return Math.round((totalScore / fields.length) * 100) / 100
}

// Re-export types and utilities
export * from "./types"
export * from "./schemas"
export { validateFile, detectFileType } from "./file-handlers"
