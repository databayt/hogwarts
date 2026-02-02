/**
 * AI-Powered Attendance Predictor
 *
 * Uses machine learning to predict students at risk of chronic absenteeism.
 *
 * FACTORS ANALYZED:
 * - Historical attendance patterns
 * - Recent attendance trends
 * - Day-of-week patterns
 * - Seasonal patterns
 * - Previous interventions
 * - Academic performance (if available)
 *
 * RISK SCORES:
 * - 0-25: Low risk (continue monitoring)
 * - 26-50: Moderate risk (proactive outreach)
 * - 51-75: High risk (intervention required)
 * - 76-100: Critical risk (immediate action)
 *
 * MODEL: Uses OpenAI GPT-4 for risk assessment
 * FALLBACK: Statistical analysis when AI unavailable
 */

import OpenAI from "openai"

import { AIErrorType, AIServiceError, DEFAULT_AI_CONFIG } from "./config"
import { aiRateLimiter } from "./rate-limiter"

// Initialize OpenAI client
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

function isAIServiceAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY
}

// Types
export interface StudentAttendanceData {
  studentId: string
  studentName: string
  grNumber: string | null
  yearLevel: string | null

  // Attendance metrics
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  excusedDays: number
  absenceRate: number

  // Trends
  lastMonthAbsenceRate: number
  thisMonthAbsenceRate: number
  trendDirection: "improving" | "declining" | "stable"

  // Patterns
  frequentAbsenceDays: string[] // Days of week with high absence
  consecutiveAbsences: number // Current or recent consecutive absences
  longestAbsenceStreak: number

  // History
  previousInterventions: number
  lastInterventionDate: Date | null
  hasActiveIntervention: boolean

  // Context
  hasGuardianContact: boolean
  hasHealthCondition: boolean
}

export interface RiskPrediction {
  studentId: string
  riskScore: number // 0-100
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
  confidence: number // 0-1
  factors: RiskFactor[]
  recommendations: string[]
  predictedAbsences30Days: number
  reasoning: string
}

export interface RiskFactor {
  factor: string
  impact: "high" | "medium" | "low"
  description: string
}

export interface BatchPredictionResult {
  predictions: RiskPrediction[]
  summary: {
    total: number
    low: number
    moderate: number
    high: number
    critical: number
    averageRiskScore: number
  }
  processedAt: Date
}

/**
 * Calculate risk score using statistical analysis (fallback)
 */
function calculateStatisticalRiskScore(
  data: StudentAttendanceData
): RiskPrediction {
  let riskScore = 0
  const factors: RiskFactor[] = []

  // Factor 1: Current absence rate (40% weight)
  const absenceRateScore = Math.min(data.absenceRate * 2, 40)
  riskScore += absenceRateScore
  if (data.absenceRate >= 20) {
    factors.push({
      factor: "High absence rate",
      impact: "high",
      description: `${data.absenceRate.toFixed(1)}% absence rate is concerning`,
    })
  } else if (data.absenceRate >= 10) {
    factors.push({
      factor: "Moderate absence rate",
      impact: "medium",
      description: `${data.absenceRate.toFixed(1)}% absence rate needs monitoring`,
    })
  }

  // Factor 2: Trend direction (20% weight)
  if (data.trendDirection === "declining") {
    riskScore += 20
    factors.push({
      factor: "Declining attendance trend",
      impact: "high",
      description: "Attendance has gotten worse recently",
    })
  } else if (data.trendDirection === "stable" && data.absenceRate >= 10) {
    riskScore += 10
    factors.push({
      factor: "Persistently poor attendance",
      impact: "medium",
      description: "High absence rate is not improving",
    })
  }

  // Factor 3: Consecutive absences (15% weight)
  if (data.consecutiveAbsences >= 3) {
    const consecutiveScore = Math.min(data.consecutiveAbsences * 3, 15)
    riskScore += consecutiveScore
    factors.push({
      factor: "Recent consecutive absences",
      impact: data.consecutiveAbsences >= 5 ? "high" : "medium",
      description: `${data.consecutiveAbsences} consecutive days absent`,
    })
  }

  // Factor 4: Day-of-week patterns (10% weight)
  if (data.frequentAbsenceDays.length >= 2) {
    riskScore += 10
    factors.push({
      factor: "Pattern-based absences",
      impact: "medium",
      description: `Frequently absent on ${data.frequentAbsenceDays.join(", ")}`,
    })
  }

  // Factor 5: No guardian contact (10% weight)
  if (!data.hasGuardianContact) {
    riskScore += 10
    factors.push({
      factor: "No guardian contact",
      impact: "medium",
      description: "Unable to reach guardian for communication",
    })
  }

  // Factor 6: Previous interventions not working (5% weight)
  if (data.previousInterventions >= 2 && data.absenceRate >= 15) {
    riskScore += 5
    factors.push({
      factor: "Intervention resistance",
      impact: "medium",
      description: "Previous interventions have not improved attendance",
    })
  }

  // Normalize to 0-100
  riskScore = Math.min(Math.max(riskScore, 0), 100)

  // Determine risk level
  let riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
  if (riskScore >= 76) riskLevel = "CRITICAL"
  else if (riskScore >= 51) riskLevel = "HIGH"
  else if (riskScore >= 26) riskLevel = "MODERATE"
  else riskLevel = "LOW"

  // Generate recommendations
  const recommendations: string[] = []
  if (riskLevel === "CRITICAL") {
    recommendations.push("Immediate administrator meeting required")
    recommendations.push("Home visit recommended")
    recommendations.push("Social worker referral")
  } else if (riskLevel === "HIGH") {
    recommendations.push("Parent phone call within 24 hours")
    recommendations.push("Counselor check-in")
    recommendations.push("Attendance contract consideration")
  } else if (riskLevel === "MODERATE") {
    recommendations.push("Monitor closely for next week")
    recommendations.push("Positive reinforcement for improvement")
    if (!data.hasGuardianContact) {
      recommendations.push("Obtain updated guardian contact")
    }
  }

  // Predict absences (simple linear projection)
  const dailyAbsenceRate = data.absenceRate / 100
  const predictedAbsences30Days = Math.round(
    30 * dailyAbsenceRate * (data.trendDirection === "declining" ? 1.2 : 1)
  )

  return {
    studentId: data.studentId,
    riskScore: Math.round(riskScore),
    riskLevel,
    confidence: 0.7, // Statistical analysis has lower confidence
    factors,
    recommendations,
    predictedAbsences30Days,
    reasoning: `Statistical analysis based on ${factors.length} risk factors.`,
  }
}

/**
 * Predict risk using AI
 */
export async function predictStudentRisk(
  data: StudentAttendanceData
): Promise<RiskPrediction> {
  // Fall back to statistical analysis if AI not available
  if (!isAIServiceAvailable()) {
    return calculateStatisticalRiskScore(data)
  }

  try {
    const openai = getOpenAIClient()

    const prompt = `You are an attendance intervention specialist. Analyze this student's attendance data and predict their risk of chronic absenteeism.

**Student Profile:**
- Name: ${data.studentName}
- Year Level: ${data.yearLevel || "Unknown"}
- ID: ${data.grNumber || data.studentId}

**Attendance Statistics:**
- Total school days: ${data.totalDays}
- Present: ${data.presentDays} days
- Absent: ${data.absentDays} days (${data.absenceRate.toFixed(1)}%)
- Late: ${data.lateDays} days
- Excused: ${data.excusedDays} days

**Trends:**
- Last month absence rate: ${data.lastMonthAbsenceRate.toFixed(1)}%
- This month absence rate: ${data.thisMonthAbsenceRate.toFixed(1)}%
- Trend direction: ${data.trendDirection}
- Current/recent consecutive absences: ${data.consecutiveAbsences}
- Longest absence streak: ${data.longestAbsenceStreak} days

**Patterns:**
- Frequently absent on: ${data.frequentAbsenceDays.join(", ") || "No pattern detected"}

**Context:**
- Previous interventions: ${data.previousInterventions}
- Last intervention: ${data.lastInterventionDate?.toLocaleDateString() || "None"}
- Active intervention: ${data.hasActiveIntervention ? "Yes" : "No"}
- Guardian contact available: ${data.hasGuardianContact ? "Yes" : "No"}
- Known health condition: ${data.hasHealthCondition ? "Yes" : "No"}

**Instructions:**
1. Calculate a risk score (0-100) for chronic absenteeism
2. Identify the key risk factors
3. Predict expected absences in the next 30 days
4. Provide specific intervention recommendations
5. Explain your reasoning

**Response Format (JSON):**
{
  "riskScore": number,
  "riskLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "confidence": number,
  "factors": [
    {"factor": "string", "impact": "high" | "medium" | "low", "description": "string"}
  ],
  "recommendations": ["string"],
  "predictedAbsences30Days": number,
  "reasoning": "string"
}`

    const response = await aiRateLimiter.enqueue(
      () =>
        openai.chat.completions.create({
          model: DEFAULT_AI_CONFIG.gradingModel,
          messages: [
            {
              role: "system",
              content:
                "You are an expert in student attendance intervention and early warning systems. Provide data-driven risk assessments.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 1000,
        }),
      1
    )

    const content = response.choices[0]?.message?.content
    if (!content) {
      return calculateStatisticalRiskScore(data)
    }

    const result = JSON.parse(content)

    return {
      studentId: data.studentId,
      riskScore: Math.min(Math.max(result.riskScore || 0, 0), 100),
      riskLevel: result.riskLevel || "MODERATE",
      confidence: Math.min(Math.max(result.confidence || 0.8, 0), 1),
      factors: result.factors || [],
      recommendations: result.recommendations || [],
      predictedAbsences30Days: result.predictedAbsences30Days || 0,
      reasoning: result.reasoning || "AI analysis completed.",
    }
  } catch (error) {
    console.error("AI prediction error:", error)
    // Fall back to statistical analysis
    return calculateStatisticalRiskScore(data)
  }
}

/**
 * Batch predict risk for multiple students
 */
export async function batchPredictRisk(
  students: StudentAttendanceData[]
): Promise<BatchPredictionResult> {
  const predictions: RiskPrediction[] = []

  // Process in batches to avoid rate limiting
  const BATCH_SIZE = 5
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map((student) => predictStudentRisk(student))
    )
    predictions.push(...batchResults)

    // Small delay between batches
    if (i + BATCH_SIZE < students.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  // Calculate summary
  const summary = {
    total: predictions.length,
    low: predictions.filter((p) => p.riskLevel === "LOW").length,
    moderate: predictions.filter((p) => p.riskLevel === "MODERATE").length,
    high: predictions.filter((p) => p.riskLevel === "HIGH").length,
    critical: predictions.filter((p) => p.riskLevel === "CRITICAL").length,
    averageRiskScore:
      predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length,
  }

  return {
    predictions,
    summary,
    processedAt: new Date(),
  }
}

/**
 * Get intervention recommendations based on risk level
 */
export function getInterventionRecommendations(
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
): { action: string; priority: number; timeline: string }[] {
  switch (riskLevel) {
    case "CRITICAL":
      return [
        { action: "Immediate home visit", priority: 1, timeline: "Today" },
        {
          action: "Administrator meeting with family",
          priority: 1,
          timeline: "Within 24 hours",
        },
        {
          action: "Social worker referral",
          priority: 2,
          timeline: "Within 48 hours",
        },
        {
          action: "Truancy board notification",
          priority: 2,
          timeline: "Within 1 week",
        },
        {
          action: "Community resource connection",
          priority: 3,
          timeline: "Within 2 weeks",
        },
      ]
    case "HIGH":
      return [
        {
          action: "Parent phone call",
          priority: 1,
          timeline: "Within 24 hours",
        },
        {
          action: "Counselor check-in with student",
          priority: 1,
          timeline: "Within 48 hours",
        },
        {
          action: "Parent-teacher conference",
          priority: 2,
          timeline: "Within 1 week",
        },
        {
          action: "Attendance contract",
          priority: 2,
          timeline: "Within 1 week",
        },
        {
          action: "Mentor assignment",
          priority: 3,
          timeline: "Within 2 weeks",
        },
      ]
    case "MODERATE":
      return [
        { action: "Check-in with student", priority: 1, timeline: "This week" },
        {
          action: "Positive attendance recognition",
          priority: 2,
          timeline: "When appropriate",
        },
        {
          action: "Guardian communication",
          priority: 2,
          timeline: "Within 1 week",
        },
        {
          action: "Academic support referral",
          priority: 3,
          timeline: "If needed",
        },
      ]
    default:
      return [
        {
          action: "Continue monitoring",
          priority: 1,
          timeline: "Ongoing",
        },
        {
          action: "Celebrate good attendance",
          priority: 2,
          timeline: "Weekly",
        },
        {
          action: "Gamification participation",
          priority: 3,
          timeline: "Ongoing",
        },
      ]
  }
}
