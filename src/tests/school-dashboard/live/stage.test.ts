// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { stageOfGrade } from "@/components/school-dashboard/live/stage"

describe("stageOfGrade", () => {
  it("reads the school's own words first", () => {
    expect(stageOfGrade({ gradeName: "الصف الأول الثانوي", gradeNumber: 1 })).toBe("secondary")
    expect(stageOfGrade({ gradeName: "الثالث متوسط", gradeNumber: 9 })).toBe("intermediate")
    expect(stageOfGrade({ gradeName: "الصف الرابع الابتدائي", gradeNumber: 4 })).toBe("primary")
    expect(stageOfGrade({ gradeName: "KG 2", gradeNumber: 2 })).toBe("kg")
    expect(stageOfGrade({ gradeName: "الروضة - المستوى الثاني", gradeNumber: 2 })).toBe("kg")
    expect(stageOfGrade({ gradeName: "Grade 10 Secondary" })).toBe("secondary")
  })

  it("falls back to the level's name, then the year level's", () => {
    expect(stageOfGrade({ gradeName: "الصف السابع", levelName: "المرحلة المتوسطة" })).toBe("intermediate")
    expect(stageOfGrade({ gradeName: "الصف الأول", yearLevelName: "ابتدائي" })).toBe("primary")
  })

  it("a grade at or below zero is the kindergarten, whatever its level says", () => {
    expect(stageOfGrade({ gradeName: "تمهيد", gradeNumber: 0, level: "ELEMENTARY" })).toBe("kg")
    expect(stageOfGrade({ gradeName: "Level A", gradeNumber: -1 })).toBe("kg")
  })

  it("then the level enum, then the 1-6 / 7-9 / 10-12 ladder", () => {
    expect(stageOfGrade({ gradeName: "G8", gradeNumber: 8, level: "HIGH" })).toBe("secondary")
    expect(stageOfGrade({ gradeName: "G8", gradeNumber: 8, level: "MIDDLE" })).toBe("intermediate")
    expect(stageOfGrade({ gradeName: "G3", gradeNumber: 3, level: "ELEMENTARY" })).toBe("primary")
    expect(stageOfGrade({ gradeName: "G3", gradeNumber: 3 })).toBe("primary")
    expect(stageOfGrade({ gradeName: "G7", gradeNumber: 7 })).toBe("intermediate")
    expect(stageOfGrade({ gradeName: "G11", gradeNumber: 11 })).toBe("secondary")
  })

  it("is null only when nothing is known", () => {
    expect(stageOfGrade({})).toBeNull()
    expect(stageOfGrade({ gradeName: "???" })).toBeNull()
  })
})
