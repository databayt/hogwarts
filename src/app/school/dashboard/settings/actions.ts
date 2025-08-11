"use server";

import { z } from 'zod'
import { db } from '@/lib/db'
import { getTenantContext } from '@/components/platform/operator/lib/tenant'
import { revalidatePath } from 'next/cache'
import { schoolSettingsSchema } from '@/components/school/dashboard/settings/validation'

export async function updateSchoolSettings(input: z.infer<typeof schoolSettingsSchema>) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  const parsed = schoolSettingsSchema.parse(input)
  await db.school.update({ where: { id: schoolId }, data: { name: parsed.name, timezone: parsed.timezone, locale: parsed.locale, logoUrl: parsed.logoUrl || null } } as any)
  revalidatePath('/dashboard/settings')
  return { success: true as const }
}







