// OpenAI Integration for Auto-Marking System

import OpenAI from "openai"
import type { RubricWithCriteria, AIGradeResult, OCRProcessResult } from "@/components/platform/mark/types"
import { aiRateLimiter } from "./rate-limiter"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Configuration
const AI_CONFIG = {
  GRADING_MODEL: "gpt-4o", // GPT-4 Optimized
  VISION_MODEL: "gpt-4o", // GPT-4 with vision for OCR
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.3, // Lower temperature for more consistent grading
  // Token costs (approximate, as of 2025)
  COST_PER_1K_INPUT_TOKENS: 0.005, // $0.005 per 1K input tokens
  COST_PER_1K_OUTPUT_TOKENS: 0.015, // $0.015 per 1K output tokens
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
  params: GradeEssayParams
): Promise<AIGradeResult> {
  try {
    const { questionText, studentAnswer, rubric, maxPoints, sampleAnswer } = params

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

    // Use rate limiter to manage API calls
    const response = await aiRateLimiter.enqueue(
      () => openai.chat.completions.create({
        model: AI_CONFIG.GRADING_MODEL,
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
        temperature: AI_CONFIG.TEMPERATURE,
        max_tokens: AI_CONFIG.MAX_TOKENS,
      }),
      1 // Priority: 1 (essays are high priority)
    )

    // Track API cost
    const inputTokens = response.usage?.prompt_tokens || 0
    const outputTokens = response.usage?.completion_tokens || 0
    const cost =
      (inputTokens / 1000) * AI_CONFIG.COST_PER_1K_INPUT_TOKENS +
      (outputTokens / 1000) * AI_CONFIG.COST_PER_1K_OUTPUT_TOKENS
    aiRateLimiter.trackCost(cost)

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from AI")
    }

    const result = JSON.parse(content)

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
      needsReview: aiConfidence < 0.85, // Review if confidence < 85%
    }
  } catch (error) {
    console.error("AI grading error:", error)
    return {
      success: false,
      pointsAwarded: 0,
      maxPoints: params.maxPoints,
      isCorrect: false,
      aiScore: 0,
      aiConfidence: 0,
      aiReasoning: "Error occurred during AI grading",
      suggestedFeedback: "Unable to grade automatically. Please grade manually.",
      needsReview: true,
      error: error instanceof Error ? error.message : "Unknown error",
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
  params: GradeShortAnswerParams
): Promise<AIGradeResult> {
  try {
    const { questionText, studentAnswer, acceptedAnswers, sampleAnswer, maxPoints } = params

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

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.GRADING_MODEL,
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
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from AI")
    }

    const result = JSON.parse(content)

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
      needsReview: aiConfidence < 0.85,
    }
  } catch (error) {
    console.error("AI short answer grading error:", error)
    return {
      success: false,
      pointsAwarded: 0,
      maxPoints: params.maxPoints,
      isCorrect: false,
      aiScore: 0,
      aiConfidence: 0,
      aiReasoning: "Error occurred during AI grading",
      suggestedFeedback: "Unable to grade automatically. Please grade manually.",
      needsReview: true,
      error: error instanceof Error ? error.message : "Unknown error",
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
  params: ProcessOCRParams
): Promise<OCRProcessResult> {
  const startTime = Date.now()

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

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.VISION_MODEL,
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
      max_tokens: AI_CONFIG.MAX_TOKENS,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from AI")
    }

    const result = JSON.parse(content)
    const processingTime = (Date.now() - startTime) / 1000 // Convert to seconds

    return {
      success: true,
      extractedText: result.extractedText || "",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      processingTime,
    }
  } catch (error) {
    console.error("OCR processing error:", error)
    const processingTime = (Date.now() - startTime) / 1000

    return {
      success: false,
      extractedText: "",
      confidence: 0,
      error: error instanceof Error ? error.message : "Unknown error",
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
  params: GenerateQuestionParams
): Promise<{ success: boolean; questions: any[]; error?: string }> {
  try {
    const { subject, topic, difficulty, bloomLevel, questionType, count = 1 } = params

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

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.GRADING_MODEL,
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
      max_tokens: AI_CONFIG.MAX_TOKENS,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from AI")
    }

    const result = JSON.parse(content)

    return {
      success: true,
      questions: result.questions || [],
    }
  } catch (error) {
    console.error("Question generation error:", error)
    return {
      success: false,
      questions: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ========== Batch Processing ==========

export async function batchGradeEssays(
  essays: GradeEssayParams[]
): Promise<AIGradeResult[]> {
  // Process in parallel with rate limiting
  const BATCH_SIZE = 5 // Process 5 at a time
  const results: AIGradeResult[] = []

  for (let i = 0; i < essays.length; i += BATCH_SIZE) {
    const batch = essays.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map((essay) => gradeEssayWithAI(essay))
    )
    results.push(...batchResults)

    // Add small delay between batches to respect rate limits
    if (i + BATCH_SIZE < essays.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return results
}
