/**
 * AI Question Generation Service
 *
 * Uses Claude AI (Anthropic) to generate high-quality educational questions
 * based on source material and specified parameters.
 */

import Anthropic from '@anthropic-ai/sdk'
import { getGenerationPrompt, type GenerationPromptParams } from './prompts'
import type { QuestionType, DifficultyLevel, BloomLevel } from '@prisma/client'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface GenerateQuestionParams {
  context: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  bloomLevel: BloomLevel
  examType: string
  subject?: string
  aiModel?: string
  temperature?: number
}

export interface GeneratedQuestion {
  questionText: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  bloomLevel: BloomLevel
  options?: Array<{
    text: string
    isCorrect: boolean
    explanation?: string
  }>
  sampleAnswer?: string
  gradingRubric?: string
  explanation: string
  tags: string[]
  subject: string
  points: number
  timeEstimate: number
  aiModel: string
  generatedAt: Date
}

/**
 * Generate a single question using Claude AI
 */
export async function generateQuestion(
  params: GenerateQuestionParams
): Promise<GeneratedQuestion> {
  const {
    context,
    questionType,
    difficulty,
    bloomLevel,
    examType,
    subject,
    aiModel = 'claude-3-5-sonnet-20241022',
    temperature = 0.7,
  } = params

  try {
    // Build prompt
    const prompt = getGenerationPrompt({
      context,
      questionType,
      difficulty,
      bloomLevel,
      examType,
      subject,
    })

    // Call Claude API
    const message = await anthropic.messages.create({
      model: aiModel,
      max_tokens: 3000,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract content
    const content =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON response
    const generated = extractJSON(content)

    if (!generated) {
      throw new Error('Failed to parse AI response as JSON')
    }

    // Validate and structure the response
    return {
      questionText: generated.questionText,
      questionType,
      difficulty,
      bloomLevel,
      options: generated.options,
      sampleAnswer: generated.sampleAnswer,
      gradingRubric: generated.gradingRubric,
      explanation: generated.explanation,
      tags: generated.tags || [],
      subject: generated.subject || subject || 'General',
      points: generated.points || 1,
      timeEstimate: generated.timeEstimate || 2,
      aiModel,
      generatedAt: new Date(),
    }
  } catch (error) {
    console.error('Error generating question:', error)
    throw new Error(
      `Failed to generate question: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate multiple questions in batch
 */
export async function generateQuestionBatch(
  params: GenerateQuestionParams,
  count: number
): Promise<GeneratedQuestion[]> {
  const questions: GeneratedQuestion[] = []
  const errors: string[] = []

  for (let i = 0; i < count; i++) {
    try {
      const question = await generateQuestion(params)
      questions.push(question)

      // Add delay to respect rate limits (500ms between requests)
      if (i < count - 1) {
        await delay(500)
      }
    } catch (error) {
      errors.push(
        `Question ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  if (errors.length > 0) {
    console.warn(`Generated ${questions.length}/${count} questions. Errors:`, errors)
  }

  return questions
}

/**
 * Extract JSON from Claude's response
 * Handles cases where JSON is wrapped in markdown code blocks
 */
function extractJSON(text: string): any {
  // Try to find JSON in code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1])
    } catch (e) {
      // Fall through to try parsing the whole text
    }
  }

  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch (e) {
      throw new Error('Found JSON-like content but failed to parse it')
    }
  }

  throw new Error('No valid JSON found in response')
}

/**
 * Delay utility for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Estimate cost of question generation
 * Based on Claude 3.5 Sonnet pricing: $3/MTok input, $15/MTok output
 */
export function estimateGenerationCost(params: {
  questionCount: number
  avgContextTokens?: number
  avgOutputTokens?: number
}): {
  estimatedInputTokens: number
  estimatedOutputTokens: number
  estimatedCostUSD: number
} {
  const { questionCount, avgContextTokens = 2000, avgOutputTokens = 800 } = params

  const inputTokens = questionCount * avgContextTokens
  const outputTokens = questionCount * avgOutputTokens

  // Pricing: $3/MTok input, $15/MTok output
  const inputCost = (inputTokens / 1_000_000) * 3
  const outputCost = (outputTokens / 1_000_000) * 15
  const totalCost = inputCost + outputCost

  return {
    estimatedInputTokens: inputTokens,
    estimatedOutputTokens: outputTokens,
    estimatedCostUSD: totalCost,
  }
}
