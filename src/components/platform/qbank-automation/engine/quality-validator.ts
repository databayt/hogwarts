/**
 * Quality Validation System
 *
 * Automated quality scoring for AI-generated questions
 * using multiple validation checks and metrics.
 */

import type { GeneratedQuestion } from "./question-generator"

export interface ValidationResult {
  score: number // 0-100
  passed: boolean // true if score >= 70
  checks: ValidationCheck[]
  issues: string[]
  suggestions: string[]
}

export interface ValidationCheck {
  name: string
  passed: boolean
  score: number
  details?: string
}

/**
 * Validate a generated question and return quality score
 */
export async function validateQuestion(
  question: GeneratedQuestion
): Promise<ValidationResult> {
  const checks: ValidationCheck[] = []
  const issues: string[] = []
  const suggestions: string[] = []

  // 1. Question text validation
  const questionTextCheck = validateQuestionText(question.questionText)
  checks.push(questionTextCheck)
  if (!questionTextCheck.passed) {
    issues.push(questionTextCheck.details || "Question text validation failed")
  }

  // 2. Options validation (for MCQ)
  if (question.options && question.options.length > 0) {
    const optionsCheck = validateOptions(question.options)
    checks.push(optionsCheck)
    if (!optionsCheck.passed) {
      issues.push(optionsCheck.details || "Options validation failed")
    }

    // Check option balance
    const balanceCheck = validateOptionBalance(question.options)
    checks.push(balanceCheck)
    if (!balanceCheck.passed) {
      suggestions.push(
        "Consider making options more similar in length for better quality"
      )
    }
  }

  // 3. Explanation validation
  const explanationCheck = validateExplanation(question.explanation)
  checks.push(explanationCheck)
  if (!explanationCheck.passed) {
    issues.push(
      explanationCheck.details || "Explanation is too short or missing"
    )
  }

  // 4. Tags validation
  const tagsCheck = validateTags(question.tags)
  checks.push(tagsCheck)
  if (!tagsCheck.passed) {
    suggestions.push("Add more descriptive tags to improve discoverability")
  }

  // 5. Grammar and spelling check (basic)
  const grammarCheck = validateGrammar(question.questionText)
  checks.push(grammarCheck)
  if (!grammarCheck.passed) {
    issues.push(grammarCheck.details || "Grammar issues detected")
  }

  // 6. Duplicate detection (future: semantic similarity check)
  // This would require database query to find similar questions

  // Calculate overall score (weighted average)
  const weights = {
    questionText: 0.25,
    options: 0.25,
    explanation: 0.2,
    tags: 0.1,
    grammar: 0.15,
    balance: 0.05,
  }

  const weightedScore =
    (questionTextCheck.score * weights.questionText +
      (checks.find((c) => c.name === "Options")?.score || 100) *
        weights.options +
      explanationCheck.score * weights.explanation +
      tagsCheck.score * weights.tags +
      grammarCheck.score * weights.grammar +
      (checks.find((c) => c.name === "Option Balance")?.score || 100) *
        weights.balance) /
    (weights.questionText +
      weights.options +
      weights.explanation +
      weights.tags +
      weights.grammar +
      weights.balance)

  const finalScore = Math.round(weightedScore)

  return {
    score: finalScore,
    passed: finalScore >= 70,
    checks,
    issues,
    suggestions,
  }
}

/**
 * Validate question text
 */
function validateQuestionText(text: string): ValidationCheck {
  const wordCount = text.split(/\s+/).length
  const charCount = text.length

  let score = 100
  let details: string | undefined

  // Too short
  if (wordCount < 10) {
    score = 30
    details = `Question is too short (${wordCount} words, minimum 10 expected)`
  }
  // Too long
  else if (wordCount > 200) {
    score = 70
    details = `Question is very long (${wordCount} words, consider simplifying)`
  }
  // Check for question mark (common in direct questions)
  else if (!text.includes("?") && !text.toLowerCase().includes("which")) {
    score = 90
    details = "Question might benefit from clearer phrasing"
  }
  // Check for empty or very short
  else if (charCount < 50) {
    score = 40
    details = "Question text is too brief"
  }

  return {
    name: "Question Text",
    passed: score >= 70,
    score,
    details,
  }
}

/**
 * Validate options for multiple choice questions
 */
function validateOptions(
  options: Array<{ text: string; isCorrect: boolean }>
): ValidationCheck {
  let score = 100
  let details: string | undefined

  // Check number of options
  if (options.length < 2) {
    return {
      name: "Options",
      passed: false,
      score: 0,
      details: "Must have at least 2 options",
    }
  }

  // Count correct answers
  const correctCount = options.filter((o) => o.isCorrect).length

  if (correctCount === 0) {
    return {
      name: "Options",
      passed: false,
      score: 0,
      details: "No correct answer specified",
    }
  }

  if (correctCount > 1 && options.length > 2) {
    score = 60
    details = "Multiple correct answers (ensure this is intentional)"
  }

  // Check option text lengths
  const emptyOptions = options.filter((o) => o.text.trim().length < 2)
  if (emptyOptions.length > 0) {
    score = 30
    details = `${emptyOptions.length} option(s) are empty or too short`
  }

  // Check for duplicate options
  const uniqueTexts = new Set(options.map((o) => o.text.toLowerCase()))
  if (uniqueTexts.size < options.length) {
    score = 40
    details = "Duplicate options detected"
  }

  return {
    name: "Options",
    passed: score >= 70,
    score,
    details,
  }
}

/**
 * Validate option balance (similar lengths reduce bias)
 */
function validateOptionBalance(
  options: Array<{ text: string; isCorrect: boolean }>
): ValidationCheck {
  const lengths = options.map((o) => o.text.length)
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance =
    lengths.reduce((sum, len) => sum + Math.abs(len - avgLength), 0) /
    lengths.length

  let score = 100

  // High variance means unbalanced options
  if (variance > 50) {
    score = 60
  } else if (variance > 30) {
    score = 80
  } else if (variance > 15) {
    score = 90
  }

  return {
    name: "Option Balance",
    passed: score >= 70,
    score,
    details:
      variance > 30
        ? `Options vary significantly in length (variance: ${variance.toFixed(0)} chars)`
        : undefined,
  }
}

/**
 * Validate explanation
 */
function validateExplanation(explanation: string): ValidationCheck {
  const wordCount = explanation.split(/\s+/).length
  let score = 100
  let details: string | undefined

  if (wordCount < 20) {
    score = 40
    details = `Explanation is too brief (${wordCount} words, minimum 20 recommended)`
  } else if (wordCount < 50) {
    score = 70
    details = "Explanation could be more detailed"
  } else if (wordCount > 300) {
    score = 85
    details = "Explanation is quite lengthy (consider condensing)"
  }

  // Check for key teaching words
  const teachingWords = [
    "because",
    "therefore",
    "thus",
    "since",
    "however",
    "although",
    "indicates",
    "shows",
    "demonstrates",
  ]
  const hasTeachingLanguage = teachingWords.some((word) =>
    explanation.toLowerCase().includes(word)
  )

  if (!hasTeachingLanguage && wordCount > 20) {
    score = Math.min(score, 90)
    details = "Explanation could benefit from clearer reasoning language"
  }

  return {
    name: "Explanation",
    passed: score >= 70,
    score,
    details,
  }
}

/**
 * Validate tags
 */
function validateTags(tags: string[]): ValidationCheck {
  let score = 100
  let details: string | undefined

  if (tags.length === 0) {
    score = 50
    details = "No tags provided (add tags for better organization)"
  } else if (tags.length === 1) {
    score = 75
    details = "Consider adding more tags"
  } else if (tags.length > 10) {
    score = 85
    details = "Many tags (consider reducing to most relevant)"
  }

  // Check tag quality
  const shortTags = tags.filter((t) => t.length < 3)
  if (shortTags.length > 0) {
    score = Math.min(score, 80)
    details = "Some tags are very short"
  }

  return {
    name: "Tags",
    passed: score >= 70,
    score,
    details,
  }
}

/**
 * Basic grammar validation
 * (In production, integrate with LanguageTool API for better results)
 */
function validateGrammar(text: string): ValidationCheck {
  let score = 100
  const issues: string[] = []

  // Check for double spaces
  if (/  +/.test(text)) {
    score -= 5
    issues.push("Double spaces detected")
  }

  // Check for missing capitalization at start
  if (text.length > 0 && !/^[A-Z]/.test(text)) {
    score -= 10
    issues.push("Question should start with capital letter")
  }

  // Check for common typos/issues
  const commonIssues = [
    { pattern: /\s,/, issue: "Space before comma" },
    { pattern: /\s\./, issue: "Space before period" },
    { pattern: /[a-z]\.[A-Z]/, issue: "Missing space after period" },
  ]

  for (const check of commonIssues) {
    if (check.pattern.test(text)) {
      score -= 5
      issues.push(check.issue)
    }
  }

  return {
    name: "Grammar",
    passed: score >= 70,
    score: Math.max(0, score),
    details: issues.length > 0 ? issues.join("; ") : undefined,
  }
}

/**
 * Find similar questions (placeholder for semantic similarity)
 * In production, implement vector similarity search using embeddings
 */
export async function findSimilarQuestions(
  questionText: string
): Promise<Array<{ id: string; similarity: number }>> {
  // TODO: Implement semantic similarity search
  // 1. Generate embedding for questionText
  // 2. Query database for similar vectors
  // 3. Return matches above threshold (e.g., 0.85)

  return []
}

/**
 * Batch validate multiple questions
 */
export async function validateQuestionBatch(
  questions: GeneratedQuestion[]
): Promise<ValidationResult[]> {
  return Promise.all(questions.map((q) => validateQuestion(q)))
}

/**
 * Get validation summary statistics
 */
export function getValidationSummary(results: ValidationResult[]): {
  totalQuestions: number
  passedQuestions: number
  failedQuestions: number
  averageScore: number
  commonIssues: Array<{ issue: string; count: number }>
} {
  const totalQuestions = results.length
  const passedQuestions = results.filter((r) => r.passed).length
  const failedQuestions = totalQuestions - passedQuestions
  const averageScore =
    results.reduce((sum, r) => sum + r.score, 0) / totalQuestions

  // Count common issues
  const issueMap = new Map<string, number>()
  for (const result of results) {
    for (const issue of result.issues) {
      issueMap.set(issue, (issueMap.get(issue) || 0) + 1)
    }
  }

  const commonIssues = Array.from(issueMap.entries())
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10 issues

  return {
    totalQuestions,
    passedQuestions,
    failedQuestions,
    averageScore,
    commonIssues,
  }
}
