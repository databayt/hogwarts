"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { processOCRWithAI } from "@/lib/ai/openai"
import { db } from "@/lib/db"

import type { ActionResponse, OCRResult } from "./types"

/**
 * Process uploaded handwritten answer using OCR
 */
export async function processAnswerOCR(
  studentAnswerId: string
): Promise<ActionResponse<OCRResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Get student answer with question
    const studentAnswer = await db.studentAnswer.findFirst({
      where: { id: studentAnswerId, schoolId },
      include: { question: true },
    })

    if (!studentAnswer) {
      return {
        success: false,
        error: "Answer not found",
        code: "ANSWER_NOT_FOUND",
      }
    }

    if (!studentAnswer.uploadUrl) {
      return {
        success: false,
        error: "No uploaded image found for this answer",
        code: "NO_UPLOAD",
      }
    }

    // Process OCR using AI service
    const ocrResult = await processOCRWithAI({
      imageUrl: studentAnswer.uploadUrl,
      questionText: studentAnswer.question.questionText,
    })

    if (!ocrResult.success) {
      return {
        success: false,
        error: ocrResult.error || "OCR processing failed",
        code: "OCR_FAILED",
      }
    }

    // Update student answer with OCR results
    await db.studentAnswer.update({
      where: { id: studentAnswerId },
      data: {
        ocrText: ocrResult.extractedText,
        ocrConfidence: ocrResult.confidence,
        submissionType: "OCR",
      },
    })

    revalidatePath("/exams/mark")
    revalidatePath(`/exams/${studentAnswer.examId}`)

    return {
      success: true,
      data: {
        success: true,
        extractedText: ocrResult.extractedText,
        confidence: ocrResult.confidence,
      },
    }
  } catch (error) {
    console.error("OCR processing error:", error)
    return {
      success: false,
      error: "OCR processing failed",
      code: "OCR_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Batch process OCR for multiple uploaded answers
 */
export async function batchProcessOCR(
  examId: string,
  questionId?: string
): Promise<
  ActionResponse<{
    processed: number
    failed: number
    skipped: number
    total: number
  }>
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Build query
    const where: any = {
      schoolId,
      examId,
      uploadUrl: { not: null },
      ocrText: null, // Only process answers not yet OCR'd
    }

    if (questionId) {
      where.questionId = questionId
    }

    // Get answers that need OCR processing
    const answers = await db.studentAnswer.findMany({
      where,
      select: {
        id: true,
        uploadUrl: true,
      },
    })

    let processed = 0
    let failed = 0
    let skipped = 0

    for (const answer of answers) {
      if (!answer.uploadUrl) {
        skipped++
        continue
      }

      try {
        const result = await processAnswerOCR(answer.id)
        if (result.success) {
          processed++
        } else {
          failed++
          console.error(`Failed to OCR answer ${answer.id}:`, result.error)
        }
      } catch (error) {
        failed++
        console.error(`Error processing OCR for answer ${answer.id}:`, error)
      }

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    return {
      success: true,
      data: {
        processed,
        failed,
        skipped,
        total: answers.length,
      },
    }
  } catch (error) {
    console.error("Batch OCR error:", error)
    return {
      success: false,
      error: "Batch OCR processing failed",
      code: "BATCH_OCR_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Verify and correct OCR text manually
 */
export async function correctOCRText(
  studentAnswerId: string,
  correctedText: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Check permissions
    if (!["ADMIN", "TEACHER"].includes(session?.user?.role || "")) {
      return {
        success: false,
        error: "Insufficient permissions to correct OCR text",
        code: "PERMISSION_DENIED",
      }
    }

    // Verify answer exists
    const studentAnswer = await db.studentAnswer.findFirst({
      where: { id: studentAnswerId, schoolId },
    })

    if (!studentAnswer) {
      return {
        success: false,
        error: "Answer not found",
        code: "ANSWER_NOT_FOUND",
      }
    }

    // Update with corrected text
    await db.studentAnswer.update({
      where: { id: studentAnswerId },
      data: {
        ocrText: correctedText,
      },
    })

    revalidatePath("/exams/mark")
    revalidatePath(`/exams/${studentAnswer.examId}`)

    return { success: true }
  } catch (error) {
    console.error("Correct OCR text error:", error)
    return {
      success: false,
      error: "Failed to correct OCR text",
      code: "CORRECTION_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Get OCR processing status for an exam
 */
export async function getOCRStatus(examId: string): Promise<
  ActionResponse<{
    total: number
    processed: number
    pending: number
    failed: number
    corrected: number
  }>
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Get counts for different OCR states
    const [total, processed] = await Promise.all([
      // Total uploaded answers
      db.studentAnswer.count({
        where: {
          examId,
          schoolId,
          uploadUrl: { not: null },
        },
      }),
      // Processed (has OCR text)
      db.studentAnswer.count({
        where: {
          examId,
          schoolId,
          uploadUrl: { not: null },
          ocrText: { not: null },
        },
      }),
    ])

    const pending = total - processed

    return {
      success: true,
      data: {
        total,
        processed,
        pending,
        failed: 0, // Would need error tracking to determine this
        corrected: 0, // OCR correction tracking not implemented in schema
      },
    }
  } catch (error) {
    console.error("Get OCR status error:", error)
    return {
      success: false,
      error: "Failed to get OCR status",
      code: "STATUS_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}
