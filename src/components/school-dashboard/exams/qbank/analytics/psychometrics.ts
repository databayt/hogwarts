/**
 * Psychometric Analysis Functions
 *
 * Classical Test Theory (CTT) metrics for item analysis:
 * - Difficulty Index (p-value): Proportion of students answering correctly
 * - Discrimination Index (D-index): Difference between high and low performers
 * - Point-Biserial Correlation: Correlation between item score and total score
 * - Distractor Analysis: Effectiveness of incorrect options in MCQ
 *
 * References:
 * - University of Arizona: https://phoenixmed.arizona.edu/assessment/item-analysis
 * - Kehoe, J. (1995). Basic item analysis for multiple-choice tests
 */

// Types for psychometric analysis
export interface ResponseData {
  studentId: string
  isCorrect: boolean
  pointsAwarded: number
  maxPoints: number
  selectedOptions: string[]
  studentTotal: number | null
  studentRank: number | null
}

export interface DistractorData {
  optionIndex: number
  optionId: string
  selectedCount: number
  highGroupCount: number
  lowGroupCount: number
  isCorrect: boolean
  effectiveness: "good" | "weak" | "non-functional"
}

export interface QualityAssessment {
  score: number
  flags: string[]
  recommendedAction: "keep" | "revise" | "retire" | "needs_review"
}

/**
 * Calculate Difficulty Index (p-value)
 * Formula: p = C / N
 * Where C = number correct, N = total responses
 *
 * Interpretation:
 * - 0.0-0.20: Very difficult
 * - 0.21-0.40: Moderately difficult
 * - 0.41-0.60: Optimal difficulty
 * - 0.61-0.80: Moderately easy
 * - 0.81-1.00: Very easy
 */
export function calcDifficultyIndex(
  correctCount: number,
  totalResponses: number
): number {
  if (totalResponses === 0) return 0
  return correctCount / totalResponses
}

/**
 * Calculate Discrimination Index (D-index)
 * Formula: D = (U_H - U_L) / n
 * Where:
 * - U_H = correct responses in high group (top 27%)
 * - U_L = correct responses in low group (bottom 27%)
 * - n = number of students in each group
 *
 * Interpretation:
 * - >= 0.40: Excellent discrimination
 * - 0.30-0.39: Good discrimination
 * - 0.20-0.29: Fair discrimination
 * - < 0.20: Poor discrimination (consider revision)
 * - Negative: Miskeyed or flawed item
 */
export function calcDiscriminationIndex(
  highGroupCorrect: number,
  highGroupTotal: number,
  lowGroupCorrect: number,
  lowGroupTotal: number
): number {
  if (highGroupTotal === 0 || lowGroupTotal === 0) return 0

  const highProportion = highGroupCorrect / highGroupTotal
  const lowProportion = lowGroupCorrect / lowGroupTotal

  return highProportion - lowProportion
}

/**
 * Calculate Point-Biserial Correlation
 * Formula: r_pb = (M_p - M_q) / S_t * sqrt(p * q)
 * Where:
 * - M_p = mean total score for students answering correctly
 * - M_q = mean total score for students answering incorrectly
 * - S_t = standard deviation of total scores
 * - p = proportion correct
 * - q = 1 - p
 *
 * Interpretation:
 * - >= 0.30: Strong positive discrimination
 * - 0.15-0.29: Moderate positive discrimination
 * - 0.00-0.14: Weak positive discrimination
 * - Negative: Item discriminates against high achievers
 */
export function calcPointBiserial(responses: ResponseData[]): number {
  if (responses.length < 10) return 0 // Need sufficient sample

  const withTotals = responses.filter((r) => r.studentTotal !== null)
  if (withTotals.length < 10) return 0

  const correct = withTotals.filter((r) => r.isCorrect)
  const incorrect = withTotals.filter((r) => !r.isCorrect)

  if (correct.length === 0 || incorrect.length === 0) return 0

  // Mean total score for correct vs incorrect
  const meanCorrect =
    correct.reduce((sum, r) => sum + (r.studentTotal || 0), 0) / correct.length
  const meanIncorrect =
    incorrect.reduce((sum, r) => sum + (r.studentTotal || 0), 0) /
    incorrect.length

  // Standard deviation of all total scores
  const allTotals = withTotals.map((r) => r.studentTotal || 0)
  const mean = allTotals.reduce((a, b) => a + b, 0) / allTotals.length
  const variance =
    allTotals.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) /
    allTotals.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return 0

  // Proportions
  const p = correct.length / withTotals.length
  const q = 1 - p

  // Point-biserial formula
  return ((meanCorrect - meanIncorrect) / stdDev) * Math.sqrt(p * q)
}

/**
 * Analyze distractor effectiveness for MCQ
 * Good distractors:
 * - Attract at least 5% of responses
 * - Are selected more by low performers than high performers
 */
export function analyzeDistractors(
  responses: ResponseData[],
  totalOptions: number,
  correctOptionIndices: number[]
): DistractorData[] {
  if (responses.length < 10) return []

  // Sort by rank and split into high/low groups (top/bottom 27%)
  const withRanks = responses.filter((r) => r.studentRank !== null)
  if (withRanks.length < 10) return []

  const sortedByRank = [...withRanks].sort(
    (a, b) => (a.studentRank || 0) - (b.studentRank || 0)
  )
  const groupSize = Math.ceil(sortedByRank.length * 0.27)
  const highGroup = sortedByRank.slice(0, groupSize) // Top performers
  const lowGroup = sortedByRank.slice(-groupSize) // Bottom performers

  const results: DistractorData[] = []

  for (let i = 0; i < totalOptions; i++) {
    const optionId = i.toString()
    const isCorrect = correctOptionIndices.includes(i)

    // Count selections for this option
    const selectedCount = responses.filter((r) =>
      r.selectedOptions.includes(optionId)
    ).length
    const highGroupCount = highGroup.filter((r) =>
      r.selectedOptions.includes(optionId)
    ).length
    const lowGroupCount = lowGroup.filter((r) =>
      r.selectedOptions.includes(optionId)
    ).length

    // Determine effectiveness
    let effectiveness: "good" | "weak" | "non-functional"
    if (isCorrect) {
      // For correct option, high group should select more
      effectiveness =
        highGroupCount > lowGroupCount
          ? "good"
          : highGroupCount < lowGroupCount
            ? "weak"
            : "good"
    } else {
      // For distractors, low group should select more
      const selectionRate = selectedCount / responses.length
      if (selectionRate < 0.05) {
        effectiveness = "non-functional"
      } else if (lowGroupCount >= highGroupCount) {
        effectiveness = "good"
      } else {
        effectiveness = "weak"
      }
    }

    results.push({
      optionIndex: i,
      optionId,
      selectedCount,
      highGroupCount,
      lowGroupCount,
      isCorrect,
      effectiveness,
    })
  }

  return results
}

/**
 * Calculate composite quality score and generate recommendations
 */
export function assessItemQuality(
  difficultyIndex: number,
  discriminationIndex: number,
  pointBiserial: number,
  sampleSize: number,
  distractorAnalysis?: DistractorData[]
): QualityAssessment {
  const flags: string[] = []
  let score = 100

  // Sample size check
  if (sampleSize < 30) {
    flags.push("insufficient_data")
    score -= 10
  }

  // Difficulty check
  if (difficultyIndex > 0.9) {
    flags.push("too_easy")
    score -= 20
  } else if (difficultyIndex < 0.2) {
    flags.push("too_hard")
    score -= 15
  } else if (difficultyIndex >= 0.4 && difficultyIndex <= 0.7) {
    // Optimal range
    score += 5
  }

  // Discrimination check
  if (discriminationIndex < 0) {
    flags.push("negative_discrimination")
    score -= 40
  } else if (discriminationIndex < 0.2) {
    flags.push("low_discrimination")
    score -= 25
  } else if (discriminationIndex >= 0.3) {
    // Good discrimination
    score += 5
  }

  // Point-biserial check
  if (pointBiserial < 0) {
    score -= 30
  } else if (pointBiserial < 0.15) {
    score -= 10
  } else if (pointBiserial >= 0.3) {
    score += 5
  }

  // Distractor effectiveness
  if (distractorAnalysis && distractorAnalysis.length > 0) {
    const distractors = distractorAnalysis.filter((d) => !d.isCorrect)
    const nonFunctional = distractors.filter(
      (d) => d.effectiveness === "non-functional"
    )
    const weak = distractors.filter((d) => d.effectiveness === "weak")

    if (nonFunctional.length > distractors.length / 2) {
      flags.push("poor_distractors")
      score -= 15
    } else if (weak.length > distractors.length / 2) {
      score -= 5
    }
  }

  // Cap score at 0-100
  score = Math.max(0, Math.min(100, score))

  // Determine recommended action
  let recommendedAction: QualityAssessment["recommendedAction"]
  if (flags.includes("negative_discrimination")) {
    recommendedAction = "retire"
  } else if (score < 50) {
    recommendedAction = "retire"
  } else if (score < 70) {
    recommendedAction = "revise"
  } else if (flags.includes("insufficient_data")) {
    recommendedAction = "needs_review"
  } else {
    recommendedAction = "keep"
  }

  return {
    score,
    flags,
    recommendedAction,
  }
}

/**
 * Get difficulty interpretation text
 */
export function getDifficultyLabel(pValue: number): string {
  if (pValue >= 0.9) return "Very Easy"
  if (pValue >= 0.7) return "Easy"
  if (pValue >= 0.5) return "Moderate"
  if (pValue >= 0.3) return "Difficult"
  return "Very Difficult"
}

/**
 * Get discrimination interpretation text
 */
export function getDiscriminationLabel(dIndex: number): string {
  if (dIndex >= 0.4) return "Excellent"
  if (dIndex >= 0.3) return "Good"
  if (dIndex >= 0.2) return "Fair"
  if (dIndex >= 0) return "Poor"
  return "Needs Review"
}

/**
 * Get quality score color for UI
 */
export function getQualityColor(
  score: number
): "green" | "yellow" | "orange" | "red" {
  if (score >= 80) return "green"
  if (score >= 60) return "yellow"
  if (score >= 40) return "orange"
  return "red"
}
