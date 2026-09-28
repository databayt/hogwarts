"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"
import { refreshPage } from "@/lib/refresh-page"

import { requireSchoolRole } from "../../require-school-admin"
import {
  templateSchema,
  templateUpdateSchema,
  type TemplateInput,
} from "../validation"

export async function getTemplates() {
  const { schoolId } = await requireSchoolRole()

  return db.notificationTemplate.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
  })
}

export async function createTemplate(input: TemplateInput) {
  const { schoolId } = await requireSchoolRole()

  const validated = templateSchema.parse(input)

  const template = await db.notificationTemplate.create({
    data: {
      schoolId,
      ...validated,
    },
  })

  refreshPage("/school/communication/templates")
  return template
}

export async function updateTemplate(input: unknown) {
  const { schoolId } = await requireSchoolRole()

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

  refreshPage("/school/communication/templates")
  return template
}

export async function deleteTemplate(id: string) {
  const { schoolId } = await requireSchoolRole()

  const existing = await db.notificationTemplate.findFirst({
    where: { id, schoolId },
  })
  if (!existing) throw new Error("Template not found")

  await db.notificationTemplate.delete({ where: { id } })

  refreshPage("/school/communication/templates")
  return { success: true }
}
