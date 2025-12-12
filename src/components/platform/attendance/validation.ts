import { z } from 'zod'

export const markAttendanceSchema = z.object({
  classId: z.string().min(1),
  date: z.string().min(1),
  records: z.array(z.object({ studentId: z.string().min(1), status: z.enum(['present', 'absent', 'late']) }))
})

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>

// Intervention type enum matching Prisma
export const interventionTypeEnum = z.enum([
  'PARENT_PHONE_CALL',
  'PARENT_EMAIL',
  'PARENT_MEETING',
  'HOME_VISIT',
  'COUNSELOR_REFERRAL',
  'SOCIAL_WORKER_REFERRAL',
  'ADMINISTRATOR_MEETING',
  'ATTENDANCE_CONTRACT',
  'TRUANCY_REFERRAL',
  'COMMUNITY_RESOURCE',
  'ACADEMIC_SUPPORT',
  'MENTORSHIP_ASSIGNMENT',
  'INCENTIVE_PROGRAM',
  'OTHER',
])

export type InterventionType = z.infer<typeof interventionTypeEnum>

// Intervention status enum matching Prisma
export const interventionStatusEnum = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'ESCALATED',
])

export type InterventionStatus = z.infer<typeof interventionStatusEnum>

// Create intervention schema
export const createInterventionSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  type: interventionTypeEnum,
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  priority: z.number().min(1).max(4).default(2),
  scheduledDate: z.string().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export type CreateInterventionInput = z.infer<typeof createInterventionSchema>

// Update intervention schema
export const updateInterventionSchema = z.object({
  interventionId: z.string().min(1),
  status: interventionStatusEnum.optional(),
  outcome: z.string().max(2000).optional(),
  completedDate: z.string().optional(),
  followUpDate: z.string().optional(),
  parentNotified: z.boolean().optional(),
  contactMethod: z.string().optional(),
  contactResult: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z.number().min(1).max(4).optional(),
})

export type UpdateInterventionInput = z.infer<typeof updateInterventionSchema>

// Escalate intervention schema
export const escalateInterventionSchema = z.object({
  interventionId: z.string().min(1),
  newType: interventionTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  assignedTo: z.string().optional(),
})

export type EscalateInterventionInput = z.infer<typeof escalateInterventionSchema>



