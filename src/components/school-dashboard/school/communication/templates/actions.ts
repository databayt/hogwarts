"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  templateSchema,
  templateUpdateSchema,
  type TemplateInput,
} from "../validation"

export async function getTemplates() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Unauthorized")

  return db.notificationTemplate.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
  })
}

export async function createTemplate(input: TemplateInput) {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  if (!session?.user || !schoolId) throw new Error("Unauthorized")

  const validated = templateSchema.parse(input)

  const template = await db.notificationTemplate.create({
    data: {
      schoolId,
      ...validated,
    },
  })

  revalidatePath("/school/communication/templates")
  return template
}

export async function updateTemplate(input: unknown) {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  if (!session?.user || !schoolId) throw new Error("Unauthorized")

  const validated = templateUpdateSchema.parse(input)
  const { id, ...data } = validated

  const existing = await db.notificationTemplate.findFirst({
    where: { id, schoolId },
  })
  if (!existing) throw new Error("Template not found")

  const template = await db.notificationTemplate.update({
    where: { id },
    data,
  })

  revalidatePath("/school/communication/templates")
  return template
}

export async function deleteTemplate(id: string) {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  if (!session?.user || !schoolId) throw new Error("Unauthorized")

  const existing = await db.notificationTemplate.findFirst({
    where: { id, schoolId },
  })
  if (!existing) throw new Error("Template not found")

  await db.notificationTemplate.delete({ where: { id } })

  revalidatePath("/school/communication/templates")
  return { success: true }
}
