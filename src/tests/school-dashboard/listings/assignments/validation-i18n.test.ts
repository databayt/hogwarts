// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import ar from "@/components/internationalization/dictionaries/ar/assignments.json"
import en from "@/components/internationalization/dictionaries/en/assignments.json"
import {
  assignmentCreateSchema,
  createAssignmentCreateSchema,
  createAssignmentUpdateSchema,
} from "@/components/school-dashboard/listings/assignments/validation"
import { createDetailsSchema } from "@/components/school-dashboard/listings/assignments/wizard/details/validation"
import { createInformationSchema } from "@/components/school-dashboard/listings/assignments/wizard/information/validation"

const messagesOf = (result: {
  success: boolean
  error?: { issues: { message: string; path: PropertyKey[] }[] }
}) => Object.fromEntries((result.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]))

const bad = {
  title: "",
  classId: "",
  type: "HOMEWORK",
  totalPoints: 0,
  weight: 150,
  dueDate: new Date(),
}

describe("assignment schema builders speak the dictionary's language", () => {
  it("Arabic messages", () => {
    const m = messagesOf(
      createAssignmentCreateSchema(ar.validation).safeParse(bad)
    )
    expect(m.title).toBe(ar.validation.titleRequired)
    expect(m.classId).toBe(ar.validation.classRequired)
    expect(m.totalPoints).toBe(ar.validation.totalPointsMin)
    expect(m.weight).toBe(ar.validation.weightMax)
  })

  it("English messages, and the plain default schema is English", () => {
    const built = messagesOf(
      createAssignmentCreateSchema(en.validation).safeParse(bad)
    )
    const plain = messagesOf(assignmentCreateSchema.safeParse(bad))
    expect(built.title).toBe("Title is required")
    expect(plain).toEqual(built)
  })

  it("the update builder localizes the id message", () => {
    const m = messagesOf(
      createAssignmentUpdateSchema(ar.validation).safeParse({ id: "" })
    )
    expect(m.id).toBe(ar.validation.idRequired)
  })

  it("wizard details and information schemas localize too", () => {
    const d = messagesOf(
      createDetailsSchema(ar.validation).safeParse({
        totalPoints: 0,
        weight: 101,
        dueDate: "not a date",
      })
    )
    expect(d.totalPoints).toBe(ar.validation.totalPointsMin)
    expect(d.weight).toBe(ar.validation.weightMax)
    expect(d.dueDate).toBe(ar.validation.dueDateRequired)

    const i = messagesOf(
      createInformationSchema(ar.validation).safeParse({
        title: "",
        gradeId: "g",
        sectionId: null,
        subjectId: "s",
        type: "QUIZ",
      })
    )
    expect(i.title).toBe(ar.validation.titleRequired)
  })

  it("the 100% weight message is the same everywhere", () => {
    expect(en.validation.weightMax).toContain("100%")
    expect(ar.validation.weightMax).toContain("100%")
  })
})
