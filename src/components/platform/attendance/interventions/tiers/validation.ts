/**
 * MTSS Tiered Intervention Validation Schemas
 *
 * Aligned with Attendance Works national standards:
 * - Tier 1 (Universal): 0-9% absence rate - prevention
 * - Tier 2 (Targeted): 10-19% absence rate - early intervention
 * - Tier 3 (Intensive): 20%+ absence rate - intensive support
 */
import { z } from "zod"

// MTSS Tier levels
export const tierLevels = ["TIER_1", "TIER_2", "TIER_3"] as const
export type TierLevel = (typeof tierLevels)[number]

// Tier thresholds (absence rate percentages)
export const TIER_THRESHOLDS = {
  TIER_1: { min: 0, max: 9.99 }, // Satisfactory attendance
  TIER_2: { min: 10, max: 19.99 }, // At-risk / Chronic absence warning
  TIER_3: { min: 20, max: 100 }, // Chronic absence / Severe
} as const

// Intervention action types per tier
export const tier1Actions = [
  "WELCOME_MESSAGE",
  "POSITIVE_RECOGNITION",
  "ATTENDANCE_INCENTIVE",
  "CLASS_COMPETITION",
  "PERFECT_ATTENDANCE_CERTIFICATE",
] as const

export const tier2Actions = [
  "PARENT_PHONE_CALL",
  "PARENT_EMAIL",
  "COUNSELOR_CHECK_IN",
  "ACADEMIC_SUPPORT_REFERRAL",
  "ATTENDANCE_LETTER_1",
  "MENTOR_ASSIGNMENT",
  "PARENT_CONFERENCE_REQUEST",
] as const

export const tier3Actions = [
  "HOME_VISIT_SCHEDULED",
  "SOCIAL_WORKER_REFERRAL",
  "ATTENDANCE_CONTRACT",
  "ATTENDANCE_LETTER_2",
  "ATTENDANCE_LETTER_3",
  "TRUANCY_REFERRAL",
  "ADMINISTRATOR_MEETING",
  "COMMUNITY_RESOURCE_CONNECTION",
  "LEGAL_NOTICE",
] as const

export type Tier1Action = (typeof tier1Actions)[number]
export type Tier2Action = (typeof tier2Actions)[number]
export type Tier3Action = (typeof tier3Actions)[number]
export type TierAction = Tier1Action | Tier2Action | Tier3Action

// Escalation triggers
export const escalationTriggers = [
  "ABSENCE_THRESHOLD_EXCEEDED",
  "NO_RESPONSE_TO_CONTACT",
  "INTERVENTION_FAILED",
  "PATTERN_WORSENING",
  "MANUAL_ESCALATION",
] as const

export type EscalationTrigger = (typeof escalationTriggers)[number]

/**
 * Schema for creating a tiered intervention
 */
export const createTieredInterventionSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  tier: z.enum(tierLevels),
  action: z.string().min(1, "Action is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledDate: z.date().optional(),
  assignedTo: z.string().optional(),
  priority: z.number().int().min(1).max(4).default(2),
  parentNotify: z.boolean().default(true),
})

export type CreateTieredInterventionInput = z.infer<
  typeof createTieredInterventionSchema
>

/**
 * Schema for updating intervention status
 */
export const updateInterventionStatusSchema = z.object({
  interventionId: z.string().min(1),
  status: z.enum([
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "ESCALATED",
  ]),
  outcome: z.string().optional(),
  followUpDate: z.date().optional(),
  escalateToTier: z.enum(tierLevels).optional(),
  escalationReason: z.enum(escalationTriggers).optional(),
})

export type UpdateInterventionStatusInput = z.infer<
  typeof updateInterventionStatusSchema
>

/**
 * Schema for bulk intervention assignment
 */
export const bulkInterventionSchema = z.object({
  studentIds: z.array(z.string()).min(1, "At least one student required"),
  tier: z.enum(tierLevels),
  action: z.string().min(1),
  scheduledDate: z.date().optional(),
  assignedTo: z.string().optional(),
})

export type BulkInterventionInput = z.infer<typeof bulkInterventionSchema>

/**
 * Get tier level based on absence rate
 */
export function getTierFromAbsenceRate(absenceRate: number): TierLevel {
  if (absenceRate >= TIER_THRESHOLDS.TIER_3.min) return "TIER_3"
  if (absenceRate >= TIER_THRESHOLDS.TIER_2.min) return "TIER_2"
  return "TIER_1"
}

/**
 * Get recommended actions for a tier
 */
export function getRecommendedActions(tier: TierLevel): readonly string[] {
  switch (tier) {
    case "TIER_1":
      return tier1Actions
    case "TIER_2":
      return tier2Actions
    case "TIER_3":
      return tier3Actions
  }
}

/**
 * Check if escalation is needed
 */
export function shouldEscalate(
  currentTier: TierLevel,
  newAbsenceRate: number
): { shouldEscalate: boolean; newTier?: TierLevel } {
  const newTier = getTierFromAbsenceRate(newAbsenceRate)

  if (currentTier === "TIER_1" && newTier !== "TIER_1") {
    return { shouldEscalate: true, newTier }
  }
  if (currentTier === "TIER_2" && newTier === "TIER_3") {
    return { shouldEscalate: true, newTier }
  }

  return { shouldEscalate: false }
}
