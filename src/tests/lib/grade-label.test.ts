import { describe, expect, it } from "vitest"

import {
  fromGradeKey,
  getGradePreset,
  GRADE_KEYS,
  gradeKeyOf,
  gradeLabel,
  gradeRangeLabel,
  parseGrade,
  toGradeKey,
} from "@/lib/grade"
import { getGradeLabel } from "@/lib/grade-label"
import { extractGradeNumber } from "@/lib/grade-utils"
import { getAcademicConfig } from "@/components/catalog/academic-config"

describe("grade keys", () => {
  it("round-trips every key through its number", () => {
    for (const key of GRADE_KEYS) {
      expect(toGradeKey(fromGradeKey(key))).toBe(key)
    }
  })

  it("matches AcademicGrade.gradeNumber (KG1 = -1, KG2 = 0)", () => {
    expect(fromGradeKey("kg1")).toBe(-1)
    expect(fromGradeKey("kg2")).toBe(0)
    expect(fromGradeKey("g12")).toBe(12)
    expect(toGradeKey(13)).toBeNull()
  })
})

describe("SD preset", () => {
  const sd = { lang: "ar", country: "SD" } as const

  it("drops الصف and counts within the stage", () => {
    expect(gradeLabel(1, sd)).toBe("الأول ابتدائي")
    expect(gradeLabel(6, sd)).toBe("السادس ابتدائي")
    expect(gradeLabel(7, sd)).toBe("الأول متوسط")
    expect(gradeLabel(9, sd)).toBe("الثالث متوسط")
    expect(gradeLabel(10, sd)).toBe("الأول ثانوي")
    expect(gradeLabel("g12", sd)).toBe("الثالث ثانوي")
  })

  it("names kindergarten روضة أولى / ثانية", () => {
    expect(gradeLabel("kg1", sd)).toBe("روضة أولى")
    expect(gradeLabel(0, sd)).toBe("روضة ثانية")
    expect(gradeLabel("kg1", { lang: "en", country: "SD" })).toBe("KG 1")
  })

  it("keeps English as Grade n", () => {
    expect(gradeLabel(7, { lang: "en", country: "SD" })).toBe("Grade 7")
    expect(gradeLabel(7, { lang: "en", country: "SD", form: "short" })).toBe(
      "G7"
    )
  })

  it("labels ranges inside and across stages", () => {
    expect(gradeRangeLabel([3, 1, 2], sd)).toBe("الأول – الثالث ابتدائي")
    expect(gradeRangeLabel([6, 7], sd)).toBe("السادس ابتدائي – الأول متوسط")
    expect(gradeRangeLabel([1, 3], { lang: "en", country: "SD" })).toBe(
      "Grades 1–3"
    )
  })

  it("stage boundaries match the SD academic levels", () => {
    const levels = getAcademicConfig("SD").levels
    const stages = getGradePreset("SD").stages
    expect(stages.map((s) => [s.start, s.end])).toEqual(
      levels.map((l) => [l.startGrade, l.endGrade])
    )
  })
})

describe("default preset (every other country, for now)", () => {
  it("keeps الصف + the 1–12 ordinal", () => {
    expect(gradeLabel(7, { lang: "ar" })).toBe("الصف السابع")
    expect(gradeLabel(7, { lang: "ar", country: "SA" })).toBe("الصف السابع")
    expect(gradeLabel(11, { lang: "ar", form: "short" })).toBe("الحادي عشر")
    expect(gradeLabel(7, { lang: "en", country: "US" })).toBe("Grade 7")
    expect(gradeRangeLabel([1, 3], { lang: "ar" })).toBe("الصف الأول – الثالث")
  })

  it("getGradeLabel keeps its old short Arabic wording without a country", () => {
    expect(getGradeLabel(7, "ar")).toBe("السابع")
    expect(getGradeLabel(7, "en")).toBe("Grade 7")
    expect(getGradeLabel(7, "ar", "SD")).toBe("الأول متوسط")
  })
})

describe("parseGrade", () => {
  it.each([
    ["g7", 7],
    [7, 7],
    ["7", 7],
    ["Grade 7", 7],
    ["الصف السابع", 7],
    ["الأول متوسط", 7],
    ["الصف الأول المتوسط", 7],
    ["الثالث ثانوي", 12],
    ["الصف الثاني عشر", 12],
    ["الصف العاشر الثانوي", 10],
    ["الأول ابتدائي", 1],
    ["روضة 1", -1],
    ["روضة أولى", -1],
    ["الروضة الثانية", 0],
    ["KG 2", 0],
  ] as const)("%s → %s", (input, expected) => {
    expect(parseGrade(input)).toBe(expected)
  })

  it("returns null for junk", () => {
    expect(parseGrade("")).toBeNull()
    expect(parseGrade(null)).toBeNull()
    expect(parseGrade(99)).toBeNull()
  })

  it("gradeKeyOf normalizes legacy prose to the key", () => {
    expect(gradeKeyOf("الصف الثاني عشر")).toBe("g12")
    expect(gradeKeyOf("روضة 2")).toBe("kg2")
  })

  it("extractGradeNumber reads keys and SD stage names", () => {
    expect(extractGradeNumber("g12")).toBe(12)
    expect(extractGradeNumber("الثاني متوسط")).toBe(8)
  })
})
