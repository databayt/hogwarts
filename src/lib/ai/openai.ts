/**
 * OpenAI Integration for Auto-Marking System
 *
 * Provides AI-powered essay grading and OCR for handwritten answers.
 *
 * MODEL SELECTION:
 * - gpt-4o: Optimized for structured output (grading JSON)
 * - gpt-4o (vision): OCR for handwritten/scanned answer sheets
 *
 * WHY GPT-4o:
 * - Better JSON compliance than GPT-3.5
 * - More consistent grading across similar answers
 * - Vision capability for handwriting recognition
 *
 * TEMPERATURE 0.3:
 * Lower temperature = more deterministic grading.
 * Prevents same answer getting different grades on re-submission.
 *
 * COST STRUCTURE (2025):
 * - Input: $0.005 per 1K tokens
 * - Output: $0.015 per 1K tokens
 * - Vision: Additional cost for image processing
 *
 * RATE LIMITING:
 * Uses aiRateLimiter to prevent API quota exhaustion during
 * batch grading operations (e.g., grading entire class).
 *
 * GRADING FLOW:
 * 1. Build prompt with question, rubric, and student answer
 * 2. Request structured JSON response
 * 3. Parse scores per rubric criterion
 * 4. Return total score + confidence + feedback
 *
 * FALLBACK BEHAVIOR:
 * When AI service is unavailable:
 * - Returns needsReview: true with fallback message
 * - Allows manual grading to proceed
 * - Logs error for monitoring
 *
 * GOTCHAS:
 * - API key must be set in OPENAI_API_KEY env var
 * - JSON parsing can fail - always wrap in try-catch
 * - Long answers may exceed token limits
 * - Rubric quality directly affects grading accuracy
 */

import OpenAI from "openai"

import type {
  AIGradeResult,
  OCRProcessResult,
  RubricWithCriteria,
} from "@/components/platform/exams/mark/types"

import {
  AIErrorType,
  AIServiceError,
  createFallbackResult,
  DEFAULT_AI_CONFIG,
  type AIServiceConfig,
} from "./config"
import { aiRateLimiter } from "./rate-limiter"

// Initialize OpenAI client (lazy initialization to handle missing API key gracefully)
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new AIServiceError(
        "OpenAI API key not configured",
        AIErrorType.AUTH_ERROR,
        false
      )
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

/**
 * Check if AI service is available
 */
export function isAIServiceAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY
}

// Configuration (uses defaults from config.ts)
const AI_CONFIG = {
  GRADING_MODEL: DEFAULT_AI_CONFIG.gradingModel,
  VISION_MODEL: DEFAULT_AI_CONFIG.visionModel,
  MAX_TOKENS: DEFAULT_AI_CONFIG.maxTokens,
  TEMPERATURE: DEFAULT_AI_CONFIG.temperature,
  COST_PER_1K_INPUT_TOKENS: DEFAULT_AI_CONFIG.costPer1kInputTokens,
  COST_PER_1K_OUTPUT_TOKENS: DEFAULT_AI_CONFIG.costPer1kOutputTokens,
  CONFIDENCE_THRESHOLD: DEFAULT_AI_CONFIG.confidenceThreshold,
} as const

// ========== AI Essay/Short Answer Grading ==========

interface GradeEssayParams {
  questionText: string
  studentAnswer: string
  rubric: RubricWithCriteria
  maxPoints: number
  sampleAnswer?: string
}

export async function gradeEssayWithAI(
  params: GradeEssayParams,
  config: Partial<AIServiceConfig> = {}
): Promise<AIGradeResult> {
  const mergedConfig = { ...DEFAULT_AI_CONFIG, ...config }

  // Check if AI service is available
  if (!isAIServiceAvailable()) {
    console.warn("AI service not available - API key not configured")
    const fallback = createFallbackResult(
      new AIServiceError(
        "AI service not configured",
        AIErrorType.AUTH_ERROR,
        false
      )
    )
    return {
      success: false,
      pointsAwarded: 0,
      maxPoints: params.maxPoints,
      isCorrect: false,
      aiScore: 0,
      aiConfidence: 0,
      aiReasoning: fallback.fallbackReason,
      suggestedFeedback: fallback.suggestedAction,
      needsReview: true,
      error: fallback.fallbackReason,
    }
  }

  try {
    const { questionText, studentAnswer, rubric, maxPoints, sampleAnswer } =
      params

    // Build rubric criteria description
    const criteriaDescription = rubric.criteria
      .map(
        (c) =>
          `- ${c.criterion} (${c.maxPoints} points): ${c.description || "No description"}`
      )
      .join("\n")

    // Construct the grading prompt
    const prompt = `You are an expert educational assessor. Grade the following student answer based on the provided rubric.

**Question:**
${questionText}

${sampleAnswer ? `**Sample Answer (for reference):**\n${sampleAnswer}\n` : ""}

**Rubric (Total: ${maxPoints} points):**
${criteriaDescription}

**Student Answer:**
${studentAnswer}

**Instructions:**
1. Evaluate the student answer against each rubric criterion
2. Assign points for each criterion (be fair but strict)
3. Provide a total score out of ${maxPoints}
4. Calculate your confidence level (0.0 to 1.0)
5. Explain your reasoning briefly
6. Provide constructive feedback for the student

**Response Format (JSON):**
{
  "criteriaScores": [
    {"criterion": "criterion name", "pointsAwarded": number, "maxPoints": number, "comment": "brief comment"}
  ],
  "totalScore": number,
  "confidence": number,
  "reasoning": "Your detailed reasoning for the grade",
  "feedback": "Constructive feedback for the student"
}`

    const openai = getOpenAIClient()

    // Use rate limiter to manage API calls with retry logic
    const response = await aiRateLimiter.enqueue(
      () =>
        openai.chat.completions.create({
          model: mergedConfig.gradingModel,
          messages: [
            {
              role: "system",
              content:
                "You are an expert educational assessor who grades student work fairly and consistently using provided rubrics.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: mergedConfig.temperature,
          max_tokens: mergedConfig.maxTokens,
        }),
      1 // Priority: 1 (essays are high priority)
    )

    // Track API cost
    const inputTokens = response.usage?.prompt_tokens || 0
    const outputTokens = response.usage?.completion_tokens || 0
    const cost =
      (inputTokens / 1000) * mergedConfig.costPer1kInputTokens +
      (outputTokens / 1000) * mergedConfig.costPer1kOutputTokens
    aiRateLimiter.trackCost(cost)

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new AIServiceError(
        "No response content from AI",
        AIErrorType.INVALID_RESPONSE,
        true
      )
    }

    let result: any
    try {
      result = JSON.parse(content)
    } catch (parseError) {
      throw new AIServiceError(
        "Failed to parse AI response as JSON",
        AIErrorType.INVALID_RESPONSE,
        true
      )
    }

    // Validate and construct result
    const aiScore = Math.min(result.totalScore || 0, maxPoints)
    const aiConfidence = Math.max(0, Math.min(1, result.confidence || 0.5))

    return {
      success: true,
      pointsAwarded: aiScore,
      maxPoints,
      isCorrect: aiScore >= maxPoints * 0.7, // 70% threshold
      aiScore,
      aiConfidence,
      aiReasoning: result.reasoning || "No reasoning provided",
      suggestedFeedback: result.feedback || "No feedback provided",
      needsReview: aiConfidence < mergedConfig.confidenceThreshold,
    }
  } catch (error) {
    const aiError = AIServiceError.fromError(error)
    console.error("AI grading error:", aiError.type, aiError.message)

    // Create fallback result with appropriate messaging
    const fallback = createFallbackResult(aiError)

    return {
      success: false,
      pointsAwarded: 0,
      maxPoints: params.maxPoints,
      isCorrect: false,
      aiScore: 0,
      aiConfidence: 0,
      aiReasoning: fallback.fallbackReason,
      suggestedFeedback: fallback.suggestedAction,
      needsReview: true,
      error: aiError.message,
    }
  }
}

// ========== AI Short Answer Grading ==========

interface GradeShortAnswerParams {
  questionText: string
  studentAnswer: string
  acceptedAnswers?: string[]
  sampleAnswer?: string
  maxPoints: number
}

export async function gradeShortAnswerWithAI(
  params: GradeShortAnswerParams,
  config: Partial<AIServiceConfig> = {}
): Promise<AIGradeResult> {
  const mergedConfig = { ...DEFAULT_AI_CONFIG, ...config }

  // Check if AI service is available
  if (!isAIServiceAvailable()) {
    console.warn("AI service not available - API key not configured")
    const fallback = createFallbackResult(
      new AIServiceError(
        "AI service not configured",
        AIErrorType.AUTH_ERROR,
        false
      )
    )
    return {
      success: false,
      pointsAwarded: 0,
      maxPoints: params.maxPoints,
      isCorrect: false,
      aiScore: 0,
      aiConfidence: 0,
      aiReasoning: fallback.fallbackReason,
      suggestedFeedback: fallback.suggestedAction,
      needsReview: true,
      error: fallback.fallbackReason,
    }
  }

  try {
    const {
      questionText,
      studentAnswer,
      acceptedAnswers,
      sampleAnswer,
      maxPoints,
    } = params

    const prompt = `You are an expert educational assessor. Grade this short answer question.

**Question:**
${questionText}

${sampleAnswer ? `**Expected Answer:**\n${sampleAnswer}\n` : ""}
${acceptedAnswers && acceptedAnswers.length > 0 ? `**Acceptable Answers:**\n${acceptedAnswers.join(", ")}\n` : ""}

**Student Answer:**
${studentAnswer}

**Instructions:**
1. Evaluate if the student answer is correct or demonstrates understanding
2. Assign a score out of ${maxPoints} (can give partial credit)
3. Provide confidence level (0.0 to 1.0)
4. Explain your reasoning
5. Give brief feedback

**Response Format (JSON):**
{
  "score": number,
  "confidence": number,
  "isCorrect": boolean,
  "reasoning": "explanation of grade",
  "feedback": "brief feedback for student"
}`

    const openai = getOpenAIClient()

    // Use rate limiter for short answers too
    const response = await aiRateLimiter.enqueue(
      () =>
        openai.chat.completions.create({
          model: mergedConfig.gradingModel,
          messages: [
            {
              role: "system",
              content:
                "You are an expert educational assessor who grades short answer questions fairly.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: mergedConfig.temperature,
          max_tokens: 500,
        }),
      0 // Priority: 0 (short answers are lower priority than essays)
    )

    // Track API cost
    const inputTokens = response.usage?.prompt_tokens || 0
    const outputTokens = response.usage?.completion_tokens || 0
    const cost =
      (inputTokens / 1000) * mergedConfig.costPer1kInputTokens +
      (outputTokens / 1000) * mergedConfig.costPer1kOutputTokens
    aiRateLimiter.trackCost(cost)

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new AIServiceError(
        "No response content from AI",
        AIErrorType.INVALID_RESPONSE,
        true
      )
    }

    let result: any
    try {
      result = JSON.parse(content)
    } catch (parseError) {
      throw new AIServiceError(
        "Failed to parse AI response as JSON",
        AIErrorType.INVALID_RESPONSE,
        true
      )
    }

    const aiScore = Math.min(result.score || 0, maxPoints)
    const aiConfidence = Math.max(0, Math.min(1, result.confidence || 0.5))

    return {
      success: true,
      pointsAwarded: aiScore,
      maxPoints,
      isCorrect: result.isCorrect ?? aiScore >= maxPoints * 0.7,
      aiScore,
      aiConfidence,
      aiReasoning: result.reasoning || "No reasoning provided",
      suggestedFeedback: result.feedback || "No feedback provided",
      needsReview: aiConfidence < mergedConfig.confidenceThreshold,
    }
  } catch (error) {
    const aiError = AIServiceError.fromError(error)
    console.error(
      "AI short answer grading error:",
      aiError.type,
      aiError.message
    )

    const fallback = createFallbackResult(aiError)

    return {
      success: false,
      pointsAwarded: 0,
      maxPoints: params.maxPoints,
      isCorrect: false,
      aiScore: 0,
      aiConfidence: 0,
      aiReasoning: fallback.fallbackReason,
      suggestedFeedback: fallback.suggestedAction,
      needsReview: true,
      error: aiError.message,
    }
  }
}

// ========== OCR Processing with GPT-4 Vision ==========

interface ProcessOCRParams {
  imageUrl: string
  questionText?: string
  expectedFormat?: string
}

export async function processOCRWithAI(
  params: ProcessOCRParams,
  config: Partial<AIServiceConfig> = {}
): Promise<OCRProcessResult> {
  const mergedConfig = { ...DEFAULT_AI_CONFIG, ...config }
  const startTime = Date.now()

  // Check if AI service is available
  if (!isAIServiceAvailable()) {
    console.warn("AI service not available - API key not configured")
    return {
      success: false,
      extractedText: "",
      confidence: 0,
      error: "AI service not configured. Please contact administrator.",
      processingTime: 0,
    }
  }

  try {
    const { imageUrl, questionText, expectedFormat } = params

    const prompt = `Extract the handwritten or printed text from this image.
${questionText ? `This is an answer to the question: "${questionText}"` : ""}
${expectedFormat ? `Expected format: ${expectedFormat}` : ""}

**Instructions:**
1. Extract all visible text accurately
2. Preserve formatting where relevant (bullet points, numbering, etc.)
3. Indicate any text you cannot read with [illegible]
4. Provide a confidence score (0.0 to 1.0) for the extraction quality

**Response Format (JSON):**
{
  "extractedText": "the extracted text",
  "confidence": number,
  "notes": "any notes about illegible parts or issues"
}`

    const openai = getOpenAIClient()

    const response = await aiRateLimiter.enqueue(
      () =>
        openai.chat.completions.create({
          model: mergedConfig.visionModel,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                    detail: "high",
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: mergedConfig.maxTokens,
        }),
      2 // Priority: 2 (OCR is high priority)
    )

    // Track API cost (vision is more expensive)
    const inputTokens = response.usage?.prompt_tokens || 0
    const outputTokens = response.usage?.completion_tokens || 0
    const cost =
      (inputTokens / 1000) * mergedConfig.costPer1kInputTokens * 2 + // Vision costs more
      (outputTokens / 1000) * mergedConfig.costPer1kOutputTokens
    aiRateLimiter.trackCost(cost)

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new AIServiceError(
        "No response content from AI",
        AIErrorType.INVALID_RESPONSE,
        true
      )
    }

    let result: any
    try {
      result = JSON.parse(content)
    } catch (parseError) {
      throw new AIServiceError(
        "Failed to parse AI response as JSON",
        AIErrorType.INVALID_RESPONSE,
        true
      )
    }

    const processingTime = (Date.now() - startTime) / 1000

    return {
      success: true,
      extractedText: result.extractedText || "",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      processingTime,
    }
  } catch (error) {
    const aiError = AIServiceError.fromError(error)
    console.error("OCR processing error:", aiError.type, aiError.message)
    const processingTime = (Date.now() - startTime) / 1000
    const fallback = createFallbackResult(aiError)

    return {
      success: false,
      extractedText: "",
      confidence: 0,
      error: fallback.suggestedAction,
      processingTime,
    }
  }
}

// ========== Question Generation (Bonus Feature) ==========

interface GenerateQuestionParams {
  subject: string
  topic: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  bloomLevel: string
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY"
  count?: number
}

export async function generateQuestionsWithAI(
  params: GenerateQuestionParams,
  config: Partial<AIServiceConfig> = {}
): Promise<{ success: boolean; questions: any[]; error?: string }> {
  const mergedConfig = { ...DEFAULT_AI_CONFIG, ...config }

  // Check if AI service is available
  if (!isAIServiceAvailable()) {
    console.warn("AI service not available - API key not configured")
    return {
      success: false,
      questions: [],
      error: "AI service not configured. Please contact administrator.",
    }
  }

  try {
    const {
      subject,
      topic,
      difficulty,
      bloomLevel,
      questionType,
      count = 1,
    } = params

    const prompt = `Generate ${count} ${difficulty.toLowerCase()} ${questionType.replace("_", " ").toLowerCase()} question(s) for ${subject} on the topic of "${topic}" at Bloom's ${bloomLevel} level.

**Requirements:**
${questionType === "MULTIPLE_CHOICE" ? "- Provide 4 options with one correct answer\n- Include brief explanations for why each option is correct/incorrect" : ""}
${questionType === "SHORT_ANSWER" ? "- Provide a sample answer\n- Include 2-3 acceptable answer variations" : ""}
${questionType === "ESSAY" ? "- Provide a detailed rubric with 3-4 criteria\n- Include a sample answer outline" : ""}

**Response Format (JSON):**
{
  "questions": [
    {
      "questionText": "the question",
      "points": number,
      "explanation": "why this tests the concept",
      ${questionType === "MULTIPLE_CHOICE" ? '"options": [{"text": "option", "isCorrect": boolean, "explanation": "why"}],' : ""}
      ${questionType === "SHORT_ANSWER" ? '"sampleAnswer": "answer", "acceptedAnswers": ["answer1", "answer2"],' : ""}
      ${questionType === "ESSAY" ? '"rubric": {"criteria": [{"name": "criterion", "points": number, "description": "what to look for"}]},' : ""}
      "tags": ["tag1", "tag2"]
    }
  ]
}`

    const openai = getOpenAIClient()

    const response = await aiRateLimiter.enqueue(
      () =>
        openai.chat.completions.create({
          model: mergedConfig.gradingModel,
          messages: [
            {
              role: "system",
              content:
                "You are an expert educator who creates high-quality assessment questions aligned with learning objectives and Bloom's Taxonomy.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7, // Higher temperature for more creative questions
          max_tokens: mergedConfig.maxTokens,
        }),
      0 // Priority: 0 (question generation is background task)
    )

    // Track API cost
    const inputTokens = response.usage?.prompt_tokens || 0
    const outputTokens = response.usage?.completion_tokens || 0
    const cost =
      (inputTokens / 1000) * mergedConfig.costPer1kInputTokens +
      (outputTokens / 1000) * mergedConfig.costPer1kOutputTokens
    aiRateLimiter.trackCost(cost)

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new AIServiceError(
        "No response content from AI",
        AIErrorType.INVALID_RESPONSE,
        true
      )
    }

    let result: any
    try {
      result = JSON.parse(content)
    } catch (parseError) {
      throw new AIServiceError(
        "Failed to parse AI response as JSON",
        AIErrorType.INVALID_RESPONSE,
        true
      )
    }

    return {
      success: true,
      questions: result.questions || [],
    }
  } catch (error) {
    const aiError = AIServiceError.fromError(error)
    console.error("Question generation error:", aiError.type, aiError.message)
    const fallback = createFallbackResult(aiError)

    return {
      success: false,
      questions: [],
      error: fallback.suggestedAction,
    }
  }
}

// ========== Batch Processing ==========

export interface BatchGradeResult {
  results: AIGradeResult[]
  stats: {
    total: number
    successful: number
    failed: number
    needsReview: number
    totalCost: number
  }
}

export async function batchGradeEssays(
  essays: GradeEssayParams[],
  config: Partial<AIServiceConfig> = {}
): Promise<BatchGradeResult> {
  const mergedConfig = { ...DEFAULT_AI_CONFIG, ...config }

  // Check if AI service is available before processing batch
  if (!isAIServiceAvailable()) {
    console.warn("AI service not available for batch grading")
    return {
      results: essays.map((essay) => ({
        success: false,
        pointsAwarded: 0,
        maxPoints: essay.maxPoints,
        isCorrect: false,
        aiScore: 0,
        aiConfidence: 0,
        aiReasoning: "AI service not configured",
        suggestedFeedback: "Please grade manually or contact administrator.",
        needsReview: true,
        error: "AI service not available",
      })),
      stats: {
        total: essays.length,
        successful: 0,
        failed: essays.length,
        needsReview: essays.length,
        totalCost: 0,
      },
    }
  }

  // Process in parallel with rate limiting
  const BATCH_SIZE = mergedConfig.maxConcurrent
  const results: AIGradeResult[] = []
  let successful = 0
  let failed = 0
  let needsReview = 0

  for (let i = 0; i < essays.length; i += BATCH_SIZE) {
    const batch = essays.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map((essay) => gradeEssayWithAI(essay, config))
    )

    for (const result of batchResults) {
      results.push(result)
      if (result.success) {
        successful++
        if (result.needsReview) {
          needsReview++
        }
      } else {
        failed++
        needsReview++
      }
    }

    // Add small delay between batches to respect rate limits
    if (i + BATCH_SIZE < essays.length) {
      await new Promise((resolve) =>
        setTimeout(resolve, mergedConfig.baseRetryDelay)
      )
    }
  }

  const stats = aiRateLimiter.getStats()

  return {
    results,
    stats: {
      total: essays.length,
      successful,
      failed,
      needsReview,
      totalCost: stats.totalCost,
    },
  }
}

// ========== Service Health Check ==========

/**
 * Check AI service health and availability
 */
export async function checkAIServiceHealth(): Promise<{
  available: boolean
  latency?: number
  error?: string
}> {
  if (!isAIServiceAvailable()) {
    return {
      available: false,
      error: "API key not configured",
    }
  }

  const startTime = Date.now()

  try {
    const openai = getOpenAIClient()
    await openai.models.list()
    const latency = Date.now() - startTime

    return {
      available: true,
      latency,
    }
  } catch (error) {
    const aiError = AIServiceError.fromError(error)
    return {
      available: false,
      error: aiError.message,
    }
  }
}

/**
 * Get current AI service statistics
 */
export function getAIServiceStats() {
  return {
    ...aiRateLimiter.getStats(),
    serviceAvailable: isAIServiceAvailable(),
  }
}
