"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/components/saas-dashboard/lib/tenant"
import { schoolSettingsSchema } from "@/components/school-dashboard/settings/validation"

export async function updateSchoolSettings(
  input: z.infer<typeof schoolSettingsSchema>
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")
  const parsed = schoolSettingsSchema.parse(input)
  await db.school.update({
    where: { id: schoolId },
    data: {
      name: parsed.name,
      timezone: parsed.timezone,
      locale: parsed.locale,
      logoUrl: parsed.logoUrl || null,
    },
  } as any)
  revalidatePath("/lab/settings")
  return { success: true as const }
}
