import { z } from 'zod'

export const announcementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  scope: z.enum(['school', 'class', 'role']).default('school'),
  classId: z.string().optional(),
  role: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.scope === 'class' && !val.classId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'classId is required when scope is class', path: ['classId'] })
  }
  if (val.scope === 'role' && !val.role) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'role is required when scope is role', path: ['role'] })
  }
})

export type AnnouncementInput = z.infer<typeof announcementSchema>



