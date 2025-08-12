"use server";

import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  displayName: z.string().min(1),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  locale: z.enum(['ar', 'en']).default('ar'),
})

export async function updateProfile(input: z.infer<typeof schema>) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  const parsed = schema.parse(input)
  await db.user.update({ where: { id: session.user.id }, data: { username: parsed.displayName, image: parsed.avatarUrl || null } })
  revalidatePath('/dashboard/profile')
  return { success: true as const }
}


