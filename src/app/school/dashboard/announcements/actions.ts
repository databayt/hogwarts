"use server";

import { z } from 'zod'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { getTenantContext } from '@/components/platform/operator/lib/tenant'
import { revalidatePath } from 'next/cache'
import { announcementSchema } from '@/components/school/dashboard/announcements/validation'

export async function createAnnouncement(input: z.infer<typeof announcementSchema>) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  const parsed = announcementSchema.parse(input)
  await db.announcement.create(
    { data: { schoolId, title: parsed.title, body: parsed.body, scope: parsed.scope as unknown as Prisma.AnnouncementCreateInput["scope"], classId: parsed.classId ?? null, role: parsed.role ?? null } } as unknown as Prisma.AnnouncementCreateArgs
  )
  revalidatePath('/dashboard/announcements')
  return { success: true as const }
}

export async function toggleAnnouncementPublish(input: { id: string; publish: boolean }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  const parsed = z.object({ id: z.string().min(1), publish: z.boolean() }).parse(input)
  // Ensure tenant safety using updateMany with tenant-scoped where clause
  await db.announcement.updateMany({ where: { id: parsed.id, schoolId }, data: { published: parsed.publish } })
  revalidatePath('/dashboard/announcements')
  return { success: true as const }
}

export async function deleteAnnouncement(input: { id: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  const parsed = z.object({ id: z.string().min(1) }).parse(input)
  await db.announcement.deleteMany({ where: { id: parsed.id, schoolId } })
  revalidatePath('/dashboard/announcements')
  return { success: true as const }
}

export async function updateAnnouncement(input: Partial<z.infer<typeof announcementSchema>> & { id: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  const base = announcementSchema.partial()
  const schema = base.extend({ id: z.string().min(1) }).superRefine((val, ctx) => {
    if (val.scope === 'class' && !val.classId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['classId'], message: 'classId required for class scope' })
    if (val.scope === 'role' && !val.role) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['role'], message: 'role required for role scope' })
  })
  const parsed = schema.parse(input)
  const { id, ...data } = parsed
  await db.announcement.updateMany({ where: { id, schoolId }, data: data as unknown as Prisma.AnnouncementUpdateManyMutationInput })
  revalidatePath('/dashboard/announcements')
  return { success: true as const }
}



