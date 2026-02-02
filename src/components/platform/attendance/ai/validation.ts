/**
 * AI Attendance Validation Schemas & Types
 *
 * Types and schemas for AI-powered attendance predictions.
 */
import { z } from "zod"

// Risk level definitions
export const RISK_LEVELS = {
  LOW: {
    min: 0,
    max: 25,
    color: "green",
    label: { en: "Low Risk", ar: "خطر منخفض" },
    description: { en: "Continue monitoring", ar: "استمر في المراقبة" },
  },
  MODERATE: {
    min: 26,
    max: 50,
    color: "yellow",
    label: { en: "Moderate Risk", ar: "خطر متوسط" },
    description: { en: "Proactive outreach needed", ar: "يحتاج تواصل استباقي" },
  },
  HIGH: {
    min: 51,
    max: 75,
    color: "orange",
    label: { en: "High Risk", ar: "خطر عالي" },
    description: { en: "Intervention required", ar: "يتطلب تدخل" },
  },
  CRITICAL: {
    min: 76,
    max: 100,
    color: "red",
    label: { en: "Critical Risk", ar: "خطر حرج" },
    description: { en: "Immediate action required", ar: "يتطلب إجراء فوري" },
  },
} as const

export type RiskLevel = keyof typeof RISK_LEVELS

// Schemas
export const runPredictionSchema = z.object({
  studentIds: z.array(z.string()).optional(), // If empty, run for all students
  includeInactive: z.boolean().default(false),
})

export type RunPredictionInput = z.infer<typeof runPredictionSchema>

export const translateMessageSchema = z.object({
  message: z.string().min(1),
  targetLanguage: z.enum(["ar", "en"]),
  context: z.string().optional(),
})

export type TranslateMessageInput = z.infer<typeof translateMessageSchema>

// Types for UI
export interface AtRiskStudent {
  id: string
  name: string
  grNumber: string | null
  yearLevel: string | null
  profilePhotoUrl: string | null
  riskScore: number
  riskLevel: RiskLevel
  confidence: number
  absenceRate: number
  currentStreak: number
  factors: {
    factor: string
    impact: "high" | "medium" | "low"
    description: string
  }[]
  recommendations: string[]
  predictedAbsences30Days: number
  hasActiveIntervention: boolean
}

export interface PredictionSummary {
  total: number
  low: number
  moderate: number
  high: number
  critical: number
  averageRiskScore: number
  lastRunAt: Date
}

export interface TranslationHistory {
  id: string
  originalText: string
  translatedText: string
  sourceLanguage: "ar" | "en"
  targetLanguage: "ar" | "en"
  createdAt: Date
}

// Helper functions
export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 76) return "CRITICAL"
  if (score >= 51) return "HIGH"
  if (score >= 26) return "MODERATE"
  return "LOW"
}

export function getRiskColor(level: RiskLevel): string {
  return RISK_LEVELS[level].color
}

export function getRiskLabel(level: RiskLevel, locale: "en" | "ar"): string {
  return RISK_LEVELS[level].label[locale]
}

export function sortByRisk(students: AtRiskStudent[]): AtRiskStudent[] {
  return [...students].sort((a, b) => b.riskScore - a.riskScore)
}
