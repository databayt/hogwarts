// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  CURRICULUM_ACADEMIC_CONFIG,
  getAcademicConfig,
  gradesForLevel,
} from "@/components/catalog/academic-config"

describe("CURRICULUM_ACADEMIC_CONFIG", () => {
  describe("SD — byte-identical to the original Sudanese constants", () => {
    const sd = getAcademicConfig("SD")

    it("keeps the original Arabic 6+3+3 level structure", () => {
      expect(sd.levels).toEqual([
        {
          name: "المرحلة الابتدائية",
          slug: "elementary",
          level: "ELEMENTARY",
          levelOrder: 1,
          startGrade: 1,
          endGrade: 6,
        },
        {
          name: "المرحلة المتوسطة",
          slug: "middle",
          level: "MIDDLE",
          levelOrder: 2,
          startGrade: 7,
          endGrade: 9,
        },
        {
          name: "المرحلة الثانوية",
          slug: "high",
          level: "HIGH",
          levelOrder: 3,
          startGrade: 10,
          endGrade: 12,
        },
      ])
    })

    it("keeps the original Arabic grade names incl. the fallback", () => {
      expect(sd.gradeName(1)).toBe("الصف الأول")
      expect(sd.gradeName(6)).toBe("الصف السادس")
      expect(sd.gradeName(12)).toBe("الصف الثاني عشر")
      // Out-of-range fallback preserved
      expect(sd.gradeName(13)).toBe("الصف 13")
    })

    it("keeps Science/Arts streams from grade 10", () => {
      expect(sd.streams).toEqual([
        { name: "العلمي", slug: "science", streamType: "SCIENCE" },
        { name: "الأدبي", slug: "arts", streamType: "ARTS" },
      ])
      expect(sd.streamStartGrade).toBe(10)
    })

    it("derives the original level→grades ranges", () => {
      expect(gradesForLevel(sd, "ELEMENTARY")).toEqual([1, 2, 3, 4, 5, 6])
      expect(gradesForLevel(sd, "MIDDLE")).toEqual([7, 8, 9])
      expect(gradesForLevel(sd, "HIGH")).toEqual([10, 11, 12])
      expect(gradesForLevel(sd, "UNKNOWN")).toEqual([])
    })
  })

  describe("US — 5+3+4 English, no streams", () => {
    const us = getAcademicConfig("US")

    it("uses the 5+3+4 structure with English names", () => {
      expect(us.levels.map((l) => [l.level, l.startGrade, l.endGrade])).toEqual(
        [
          ["ELEMENTARY", 1, 5],
          ["MIDDLE", 6, 8],
          ["HIGH", 9, 12],
        ]
      )
      expect(us.levels[0].name).toBe("Elementary School")
      expect(us.gradeName(3)).toBe("Grade 3")
    })

    it("provisions no streams", () => {
      expect(us.streams).toEqual([])
      expect(us.streamStartGrade).toBe(99)
    })

    it("derives 5+3+4 level→grades ranges", () => {
      expect(gradesForLevel(us, "ELEMENTARY")).toEqual([1, 2, 3, 4, 5])
      expect(gradesForLevel(us, "MIDDLE")).toEqual([6, 7, 8])
      expect(gradesForLevel(us, "HIGH")).toEqual([9, 10, 11, 12])
    })
  })

  describe("other curricula", () => {
    it("GB uses Year naming and key-stage level names", () => {
      const gb = getAcademicConfig("GB")
      expect(gb.gradeName(7)).toBe("Year 7")
      expect(gb.levels[0].name).toContain("KS1")
      expect(gb.streams).toEqual([])
    })

    it("CBSE uses Class naming", () => {
      expect(getAcademicConfig("CBSE").gradeName(10)).toBe("Class 10")
    })

    it("Arab national systems share the Arabic 6+3+3 structure", () => {
      for (const code of ["SA", "EG", "AE", "QA", "KW", "JO"]) {
        expect(getAcademicConfig(code)).toBe(CURRICULUM_ACADEMIC_CONFIG.SD)
      }
    })

    it("transnational programmes use the US-style structure", () => {
      expect(getAcademicConfig("CAIE-IGCSE")).toBe(
        CURRICULUM_ACADEMIC_CONFIG.US
      )
      expect(getAcademicConfig("IB-DP")).toBe(CURRICULUM_ACADEMIC_CONFIG.US)
    })

    it("unknown/missing curriculum falls back to a generic English config", () => {
      for (const cfg of [
        getAcademicConfig("XX"),
        getAcademicConfig(null),
        getAcademicConfig(undefined),
      ]) {
        expect(cfg.gradeName(4)).toBe("Grade 4")
        expect(cfg.streams).toEqual([])
        expect(cfg.levels).toHaveLength(3)
        expect(gradesForLevel(cfg, "ELEMENTARY")).toEqual([1, 2, 3, 4, 5, 6])
      }
    })
  })

  it("every config partitions grades 1-12 contiguously without gaps", () => {
    const configs = new Set(Object.values(CURRICULUM_ACADEMIC_CONFIG))
    for (const cfg of configs) {
      const covered = cfg.levels
        .flatMap((l) => gradesForLevel(cfg, l.level))
        .sort((a, b) => a - b)
      expect(covered).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    }
  })
})
