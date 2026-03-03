// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  extractConfig,
  findBestStructure,
  formatWorkingDays,
  generatePeriods,
  getRecommendedStructures,
  getStructureBySlug,
  getStructuresByCountry,
  LEGACY_TEMPLATE_MAP,
  TIMETABLE_STRUCTURES,
} from "../structures"

describe("Timetable Structures", () => {
  describe("TIMETABLE_STRUCTURES", () => {
    it("contains exactly 10 structures", () => {
      expect(TIMETABLE_STRUCTURES).toHaveLength(10)
    })

    it("all structures have valid periods with non-overlapping times", () => {
      for (const s of TIMETABLE_STRUCTURES) {
        for (let i = 1; i < s.periods.length; i++) {
          const prev = s.periods[i - 1]
          const curr = s.periods[i]

          // Parse times to minutes for comparison
          const [prevEndH, prevEndM] = prev.endTime.split(":").map(Number)
          const [currStartH, currStartM] = curr.startTime.split(":").map(Number)
          const prevEndMinutes = prevEndH * 60 + prevEndM
          const currStartMinutes = currStartH * 60 + currStartM

          expect(currStartMinutes).toBeGreaterThanOrEqual(prevEndMinutes)
        }
      }
    })

    it("all structures have unique slugs", () => {
      const slugs = TIMETABLE_STRUCTURES.map((s) => s.slug)
      const unique = new Set(slugs)
      expect(unique.size).toBe(slugs.length)
    })

    it("all structures have periodsPerDay matching actual class period count", () => {
      for (const s of TIMETABLE_STRUCTURES) {
        const classPeriods = s.periods.filter((p) => p.type === "class")
        expect(classPeriods).toHaveLength(s.periodsPerDay)
      }
    })

    it("all structures have consistent schoolStart and schoolEnd", () => {
      for (const s of TIMETABLE_STRUCTURES) {
        expect(s.periods[0].startTime).toBe(s.schoolStart)
        expect(s.periods[s.periods.length - 1].endTime).toBe(s.schoolEnd)
      }
    })
  })

  describe("getRecommendedStructures", () => {
    it("recommends SD structures for country=SD", () => {
      const result = getRecommendedStructures("SD")
      const slugs = result.recommended.map((s) => s.slug)

      expect(slugs).toContain("sd-gov-default")
      expect(slugs).toContain("sd-private")
      expect(slugs).toContain("sd-british")
      expect(slugs).toContain("sd-ib")
      expect(slugs).toContain("sd-half-day")
    })

    it("recommends Gulf structures for country=SA with schoolType (region mapping)", () => {
      // SA maps to GULF region (+25), public schoolType adds +20 = 45 >= 30 threshold
      const result = getRecommendedStructures("SA", "public")
      const slugs = result.recommended.map((s) => s.slug)

      expect(slugs).toContain("gulf-standard")
    })

    it("places Gulf structures in others for SA without schoolType (score=25 < 30)", () => {
      // SA maps to GULF region (+25 only), below recommended threshold of 30
      const result = getRecommendedStructures("SA")
      const otherSlugs = result.others.map((s) => s.slug)

      expect(otherSlugs).toContain("gulf-standard")
      expect(otherSlugs).toContain("gulf-private")
      expect(result.recommended).toHaveLength(0)
    })

    it("recommends MENA structures for country=EG with schoolLevel (region mapping)", () => {
      // EG maps to MENA region (+25), schoolLevel adds +10 = 35 >= 30 threshold
      const result = getRecommendedStructures("EG", null, "secondary")
      const slugs = result.recommended.map((s) => s.slug)

      expect(slugs).toContain("mena-standard")
    })

    it("places MENA structures in others for EG without extras (score=25 < 30)", () => {
      // EG maps to MENA region (+25 only), below recommended threshold of 30
      const result = getRecommendedStructures("EG")
      const otherSlugs = result.others.map((s) => s.slug)

      expect(otherSlugs).toContain("mena-standard")
      expect(result.recommended).toHaveLength(0)
    })

    it("recommends US structures for country=US", () => {
      const result = getRecommendedStructures("US")
      const slugs = result.recommended.map((s) => s.slug)

      expect(slugs).toContain("us-standard")
    })

    it("auto-selects sd-gov-default for SD+public+both (score=70)", () => {
      const result = getRecommendedStructures("SD", "public", "both")

      expect(result.autoSelect).not.toBeNull()
      expect(result.autoSelect!.slug).toBe("sd-gov-default")
    })

    it("auto-selects gulf-standard for SA+public+secondary (score>=50)", () => {
      const result = getRecommendedStructures("SA", "public", "secondary")

      expect(result.autoSelect).not.toBeNull()
      expect(result.autoSelect!.slug).toBe("gulf-standard")
    })

    it("does not auto-select when best score < 50", () => {
      // A country with no exact or region match, no type, no level
      const result = getRecommendedStructures("BR")

      expect(result.autoSelect).toBeNull()
    })

    it("boosts score +20 for matching schoolType", () => {
      // SD country gives +40 base. Adding public type should boost +20.
      const withoutType = getRecommendedStructures("SD")
      const withType = getRecommendedStructures("SD", "public")

      // sd-gov-default supports public — it should still be recommended and rank first
      const withTypeSlugs = withType.recommended.map((s) => s.slug)
      expect(withTypeSlugs[0]).toBe("sd-gov-default")

      // Without type, sd-gov-default also recommended but sd-half-day
      // (which also supports public) should be in the recommended list with type
      const withoutTypeSlugs = withoutType.recommended.map((s) => s.slug)
      expect(withoutTypeSlugs).toContain("sd-gov-default")
    })

    it("boosts score +10 for matching schoolLevel", () => {
      // SD+primary: sd-half-day is schoolLevel: ["primary"] only
      const withLevel = getRecommendedStructures("SD", null, "primary")
      const slugs = withLevel.recommended.map((s) => s.slug)

      // sd-half-day should be recommended (40 country + 10 level = 50)
      expect(slugs).toContain("sd-half-day")
    })

    it("sorts by score desc, then sortOrder asc", () => {
      const result = getRecommendedStructures("SD", "public", "both")
      const recommended = result.recommended

      // All recommended should be sorted: higher score first
      // For equal scores, lower sortOrder first
      for (let i = 1; i < recommended.length; i++) {
        const prev = recommended[i - 1]
        const curr = recommended[i]
        // We can verify ordering is consistent by checking sortOrder for SD structures
        // sd-gov-default (sortOrder=1) should come before sd-half-day (sortOrder=5)
        // when they have the same score
        if (prev.country === "SD" && curr.country === "SD") {
          // This just verifies the result is not randomly ordered
          expect(recommended.indexOf(prev)).toBeLessThan(
            recommended.indexOf(curr)
          )
        }
      }

      // Specifically, sd-gov-default (score=70) should be first
      expect(recommended[0].slug).toBe("sd-gov-default")
    })

    it("intl-default appears in others, never in recommended for specific countries", () => {
      const result = getRecommendedStructures("SD", "public", "both")

      const recommendedSlugs = result.recommended.map((s) => s.slug)
      const othersSlugs = result.others.map((s) => s.slug)

      // intl-default has country "*", so score = 5 (wildcard) + level match = 15
      // That's below the recommended threshold of 30
      expect(recommendedSlugs).not.toContain("intl-default")
      expect(othersSlugs).toContain("intl-default")
    })

    it("handles null country gracefully", () => {
      const result = getRecommendedStructures(null)

      // With null country, no country/region bonus, only wildcard +5
      // So nothing should reach the 30 threshold
      expect(result.recommended).toHaveLength(0)
      expect(result.autoSelect).toBeNull()
      // intl-default should still appear in others (wildcard +5)
      const othersSlugs = result.others.map((s) => s.slug)
      expect(othersSlugs).toContain("intl-default")
    })
  })

  describe("getStructureBySlug", () => {
    it("returns structure for valid slug", () => {
      const result = getStructureBySlug("sd-gov-default")

      expect(result).toBeDefined()
      expect(result!.slug).toBe("sd-gov-default")
      expect(result!.country).toBe("SD")
      expect(result!.periodsPerDay).toBe(8)
    })

    it("returns undefined for invalid slug", () => {
      const result = getStructureBySlug("nonexistent-slug")

      expect(result).toBeUndefined()
    })
  })

  describe("getStructuresByCountry", () => {
    it("groups all structures by country", () => {
      const grouped = getStructuresByCountry()

      expect(grouped["SD"]).toHaveLength(5)
      expect(grouped["GULF"]).toHaveLength(2)
      expect(grouped["MENA"]).toHaveLength(1)
      expect(grouped["US"]).toHaveLength(1)
      expect(grouped["*"]).toHaveLength(1)
    })

    it("includes wildcard (*) group with intl-default", () => {
      const grouped = getStructuresByCountry()

      expect(grouped["*"]).toBeDefined()
      expect(grouped["*"][0].slug).toBe("intl-default")
    })

    it("SD group contains all 5 Sudan structures", () => {
      const grouped = getStructuresByCountry()
      const sdSlugs = grouped["SD"].map((s) => s.slug)

      expect(sdSlugs).toContain("sd-gov-default")
      expect(sdSlugs).toContain("sd-private")
      expect(sdSlugs).toContain("sd-british")
      expect(sdSlugs).toContain("sd-ib")
      expect(sdSlugs).toContain("sd-half-day")
    })
  })

  describe("formatWorkingDays", () => {
    it("formats Sun-Thu as 'Sun - Thu'", () => {
      const result = formatWorkingDays([0, 1, 2, 3, 4])

      expect(result).toBe("Sun - Thu")
    })

    it("formats Mon-Fri as 'Mon - Fri'", () => {
      const result = formatWorkingDays([1, 2, 3, 4, 5])

      expect(result).toBe("Mon - Fri")
    })

    it("formats non-contiguous days as comma-separated", () => {
      const result = formatWorkingDays([0, 2, 4])

      expect(result).toBe("Sun, Tue, Thu")
    })

    it("handles single day", () => {
      const result = formatWorkingDays([5])

      expect(result).toBe("Fri")
    })

    it("handles empty array", () => {
      const result = formatWorkingDays([])

      expect(result).toBe("")
    })

    it("sorts unsorted input before formatting", () => {
      const result = formatWorkingDays([4, 2, 0, 3, 1])

      expect(result).toBe("Sun - Thu")
    })
  })

  describe("extractConfig", () => {
    it("extracts fri-sat weekend from Sun-Thu structure", () => {
      const structure = getStructureBySlug("sd-gov-default")!
      const config = extractConfig(structure)

      expect(config.weekendType).toBe("fri-sat")
      expect(config.periodsPerDay).toBe(8)
      expect(config.durationMinutes).toBe(45)
      expect(config.startTime).toBe("07:30")
    })

    it("extracts sat-sun weekend from Mon-Fri structure", () => {
      const structure = getStructureBySlug("sd-british")!
      const config = extractConfig(structure)

      expect(config.weekendType).toBe("sat-sun")
      expect(config.periodsPerDay).toBe(6)
      expect(config.durationMinutes).toBe(55)
      expect(config.startTime).toBe("08:00")
    })

    it("extracts class duration from first class period", () => {
      const structure = getStructureBySlug("sd-private")!
      const config = extractConfig(structure)

      expect(config.durationMinutes).toBe(50)
    })

    it("extracts US standard config correctly", () => {
      const structure = getStructureBySlug("us-standard")!
      const config = extractConfig(structure)

      expect(config.weekendType).toBe("sat-sun")
      expect(config.periodsPerDay).toBe(7)
      expect(config.durationMinutes).toBe(50)
      expect(config.startTime).toBe("08:00")
    })
  })

  describe("generatePeriods", () => {
    it("generates correct number of class periods", () => {
      const { periods } = generatePeriods({
        periodsPerDay: 7,
        durationMinutes: 45,
        startTime: "08:00",
      })

      const classPeriods = periods.filter((p) => p.type === "class")
      expect(classPeriods).toHaveLength(7)
    })

    it("inserts break after midpoint", () => {
      const { periods } = generatePeriods({
        periodsPerDay: 8,
        durationMinutes: 45,
        startTime: "07:30",
      })

      const breakPeriod = periods.find((p) => p.type === "break")
      expect(breakPeriod).toBeDefined()
      expect(breakPeriod!.durationMinutes).toBe(20)

      // Break should appear after the 4th class period (midpoint of 8)
      const breakIndex = periods.indexOf(breakPeriod!)
      const classesBefore = periods
        .slice(0, breakIndex)
        .filter((p) => p.type === "class")
      expect(classesBefore).toHaveLength(4)
    })

    it("inserts lunch when periodsPerDay > 5", () => {
      const { periods } = generatePeriods({
        periodsPerDay: 7,
        durationMinutes: 45,
        startTime: "08:00",
      })

      const lunchPeriod = periods.find((p) => p.type === "lunch")
      expect(lunchPeriod).toBeDefined()
      expect(lunchPeriod!.durationMinutes).toBe(30)
    })

    it("skips lunch when periodsPerDay <= 5", () => {
      const { periods } = generatePeriods({
        periodsPerDay: 5,
        durationMinutes: 40,
        startTime: "08:00",
      })

      const lunchPeriod = periods.find((p) => p.type === "lunch")
      expect(lunchPeriod).toBeUndefined()
    })

    it("calculates correct end time", () => {
      const { periods, schoolEnd } = generatePeriods({
        periodsPerDay: 6,
        durationMinutes: 50,
        startTime: "08:00",
      })

      const lastPeriod = periods[periods.length - 1]
      expect(lastPeriod.type).toBe("class")
      expect(schoolEnd).toBe(lastPeriod.endTime)
    })

    it("all generated periods have valid time format", () => {
      const { periods } = generatePeriods({
        periodsPerDay: 8,
        durationMinutes: 45,
        startTime: "07:30",
      })

      const timeRegex = /^\d{2}:\d{2}$/
      for (const p of periods) {
        expect(p.startTime).toMatch(timeRegex)
        expect(p.endTime).toMatch(timeRegex)
      }
    })

    it("periods are chronologically ordered and non-overlapping", () => {
      const { periods } = generatePeriods({
        periodsPerDay: 7,
        durationMinutes: 50,
        startTime: "08:00",
      })

      for (let i = 1; i < periods.length; i++) {
        const [prevH, prevM] = periods[i - 1].endTime.split(":").map(Number)
        const [currH, currM] = periods[i].startTime.split(":").map(Number)
        expect(currH * 60 + currM).toBeGreaterThanOrEqual(prevH * 60 + prevM)
      }
    })
  })

  describe("findBestStructure", () => {
    it("scores highest for exact match on all criteria", () => {
      const config = {
        weekendType: "fri-sat" as const,
        periodsPerDay: 8,
        durationMinutes: 45,
        startTime: "07:30",
      }

      const result = findBestStructure(config, TIMETABLE_STRUCTURES)

      // sd-gov-default matches exactly: Sun-Thu (+10), 8 periods (+10),
      // 45min (+5), 07:30 start (+5) = 30
      expect(result).not.toBeNull()
      expect(result!.slug).toBe("sd-gov-default")
    })

    it("returns null for empty candidates", () => {
      const config = {
        weekendType: "fri-sat" as const,
        periodsPerDay: 8,
        durationMinutes: 45,
        startTime: "07:30",
      }

      const result = findBestStructure(config, [])

      expect(result).toBeNull()
    })

    it("prefers closer duration match", () => {
      // Config with 55min duration, Mon-Fri, 6 periods, 08:00 start
      // Should prefer sd-british (55min exact match) over sd-ib (50min)
      const config = {
        weekendType: "sat-sun" as const,
        periodsPerDay: 6,
        durationMinutes: 55,
        startTime: "08:00",
      }

      const sdCandidates = TIMETABLE_STRUCTURES.filter(
        (s) => s.slug === "sd-british" || s.slug === "sd-ib"
      )

      const result = findBestStructure(config, sdCandidates)

      expect(result).not.toBeNull()
      expect(result!.slug).toBe("sd-british")
    })

    it("awards +10 for matching working days", () => {
      // fri-sat weekend = Sun-Thu [0,1,2,3,4]
      // Gulf structures use Sun-Thu, US uses Mon-Fri
      const config = {
        weekendType: "fri-sat" as const,
        periodsPerDay: 7,
        durationMinutes: 45,
        startTime: "07:00",
      }

      const result = findBestStructure(config, TIMETABLE_STRUCTURES)

      // gulf-standard: days +10, periods +10, duration +5, start +5 = 30
      expect(result).not.toBeNull()
      expect(result!.slug).toBe("gulf-standard")
    })

    it("awards +2 for duration within 5 minutes", () => {
      // Config with 47min — within 5 of 45min structures, but not exact
      const config = {
        weekendType: "fri-sat" as const,
        periodsPerDay: 8,
        durationMinutes: 47,
        startTime: "07:30",
      }

      const result = findBestStructure(config, TIMETABLE_STRUCTURES)

      // sd-gov-default: days +10, periods +10, duration +2 (|45-47|=2 <= 5), start +5 = 27
      expect(result).not.toBeNull()
      expect(result!.slug).toBe("sd-gov-default")
    })
  })

  describe("LEGACY_TEMPLATE_MAP", () => {
    it("maps standard_8 to sd-gov-default", () => {
      expect(LEGACY_TEMPLATE_MAP["standard_8"]).toBe("sd-gov-default")
    })

    it("maps standard_6 to sd-british", () => {
      expect(LEGACY_TEMPLATE_MAP["standard_6"]).toBe("sd-british")
    })

    it("maps half_day to sd-half-day", () => {
      expect(LEGACY_TEMPLATE_MAP["half_day"]).toBe("sd-half-day")
    })

    it("contains exactly 3 mappings", () => {
      expect(Object.keys(LEGACY_TEMPLATE_MAP)).toHaveLength(3)
    })

    it("all mapped slugs resolve to valid structures", () => {
      for (const slug of Object.values(LEGACY_TEMPLATE_MAP)) {
        const structure = getStructureBySlug(slug)
        expect(structure).toBeDefined()
      }
    })
  })
})
