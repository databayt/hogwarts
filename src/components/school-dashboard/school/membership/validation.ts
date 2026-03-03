import { z } from "zod"

export const changeRoleSchema = z.object({
  userId: z.string().min(1),
  newRole: z.enum([
    "ADMIN",
    "TEACHER",
    "STUDENT",
    "GUARDIAN",
    "ACCOUNTANT",
    "STAFF",
  ]),
  // Required fields when changing to STUDENT
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
})

export const assignGradeSchema = z.object({
  userId: z.string().min(1),
  academicGradeId: z.string().min(1),
})

export const suspendMemberSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().optional(),
})

export const activateMemberSchema = z.object({
  userId: z.string().min(1),
})

export const removeMemberSchema = z.object({
  userId: z.string().min(1),
})

export const approveMemberRequestSchema = z.object({
  requestId: z.string().min(1),
})

export const rejectMemberRequestSchema = z.object({
  requestId: z.string().min(1),
  reason: z.string().min(1, "Rejection reason is required"),
})

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    "ADMIN",
    "TEACHER",
    "STUDENT",
    "GUARDIAN",
    "ACCOUNTANT",
    "STAFF",
  ]),
  name: z.string().optional(),
})

export const bulkSuspendSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
})

export const bulkActivateSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
})
