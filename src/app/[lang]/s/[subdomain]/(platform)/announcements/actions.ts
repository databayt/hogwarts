"use server";

import { z } from 'zod'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { getTenantContext } from '@/components/operator/lib/tenant'
import { revalidatePath } from 'next/cache'
import { announcementCreateSchema, announcementUpdateSchema } from '@/components/platform/announcements/validation'

export async function createAnnouncement(input: z.infer<typeof announcementCreateSchema>) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  const parsed = announcementCreateSchema.parse(input)
  await db.announcement.create(
    { data: {
      schoolId,
      titleEn: parsed.titleEn ?? null,
      titleAr: parsed.titleAr ?? null,
      bodyEn: parsed.bodyEn ?? null,
      bodyAr: parsed.bodyAr ?? null,
      scope: parsed.scope as unknown as Prisma.AnnouncementCreateInput["scope"],
      classId: parsed.classId ?? null,
      role: parsed.role ?? null,
      published: parsed.published ?? false,
    } } as unknown as Prisma.AnnouncementCreateArgs
  )
  revalidatePath('/lab/announcements')
  return { success: true as const }
}

export async function toggleAnnouncementPublish(input: { id: string; publish: boolean }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  const parsed = z.object({ id: z.string().min(1), publish: z.boolean() }).parse(input)
  // Ensure tenant safety using updateMany with tenant-scoped where clause
  await db.announcement.updateMany({ where: { id: parsed.id, schoolId }, data: { published: parsed.publish } })
  revalidatePath('/lab/announcements')
  return { success: true as const }
}

export async function deleteAnnouncement(input: { id: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  const parsed = z.object({ id: z.string().min(1) }).parse(input)
  await db.announcement.deleteMany({ where: { id: parsed.id, schoolId } })
  revalidatePath('/lab/announcements')
  return { success: true as const }
}

export async function updateAnnouncement(input: Partial<z.infer<typeof announcementUpdateSchema>> & { id: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  const base = announcementUpdateSchema.partial()
  const schema = base.extend({ id: z.string().min(1) }).superRefine((val, ctx) => {
    if (val.scope === 'class' && !val.classId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['classId'], message: 'classId required for class scope' })
    if (val.scope === 'role' && !val.role) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['role'], message: 'role required for role scope' })
  })
  const parsed = schema.parse(input)
  const { id, ...data } = parsed
  await db.announcement.updateMany({ where: { id, schoolId }, data: data as unknown as Prisma.AnnouncementUpdateManyMutationInput })
  revalidatePath('/lab/announcements')
  return { success: true as const }
}



