// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

// Import the REAL production schemas (this file previously redefined its own
// local schemas and tested Zod itself — it now exercises the source of truth).
import {
  cuidSchema,
  dayOfWeekSchema,
  deleteTimetableSlotSchema,
  getWeeklyTimetableSchema,
  suggestFreeSlotsSchema,
  upsertSchoolWeekConfigSchema,
  upsertTimetableSlotSchema,
  validateRoomAvailability,
  validateSubjectDistribution,
  validateTeacherAvailability,
  validateTeacherTravelTime,
  validateTimeSlot,
  weekOffsetSchema,
  workingDaysSchema,
} from "../validation"

// Valid CUID = c + 24 lowercase alphanumerics (matches /^c[a-z0-9]{24}$/)
const CUID_A = "caaaaaaaaaaaaaaaaaaa00001"
const CUID_B = "caaaaaaaaaaaaaaaaaaa00002"
const CUID_C = "caaaaaaaaaaaaaaaaaaa00003"
const CUID_D = "caaaaaaaaaaaaaaaaaaa00004"

describe("Timetable Validation Schemas (real source)", () => {
  describe("cuidSchema", () => {
    it("accepts a well-formed CUID", () => {
      expect(cuidSchema.parse(CUID_A)).toBe(CUID_A)
    })

    it("rejects an empty string", () => {
      expect(cuidSchema.safeParse("").success).toBe(false)
    })

    it("rejects an uppercase / wrong-length value", () => {
      expect(cuidSchema.safeParse("CAAAAAAAAAAAAAAAAAAA00001").success).toBe(
        false
      )
      expect(cuidSchema.safeParse("c123").success).toBe(false)
    })
  })

  describe("dayOfWeekSchema", () => {
    it("accepts boundary values 0 and 6", () => {
      expect(dayOfWeekSchema.parse(0)).toBe(0)
      expect(dayOfWeekSchema.parse(6)).toBe(6)
    })

    it("rejects out-of-range days", () => {
      expect(dayOfWeekSchema.safeParse(-1).success).toBe(false)
      expect(dayOfWeekSchema.safeParse(7).success).toBe(false)
    })

    it("rejects non-integers", () => {
      expect(dayOfWeekSchema.safeParse(2.5).success).toBe(false)
    })
  })

  describe("weekOffsetSchema", () => {
    it("accepts 0 and 1", () => {
      expect(weekOffsetSchema.parse(0)).toBe(0)
      expect(weekOffsetSchema.parse(1)).toBe(1)
    })

    it("defaults to 0 when undefined", () => {
      expect(weekOffsetSchema.parse(undefined)).toBe(0)
    })

    it("rejects values other than 0 or 1", () => {
      expect(weekOffsetSchema.safeParse(2).success).toBe(false)
    })
  })

  describe("workingDaysSchema", () => {
    it("accepts a valid Sun-Thu week", () => {
      expect(workingDaysSchema.parse([0, 1, 2, 3, 4])).toEqual([0, 1, 2, 3, 4])
    })

    it("rejects an empty array", () => {
      expect(workingDaysSchema.safeParse([]).success).toBe(false)
    })

    it("rejects duplicate days", () => {
      expect(workingDaysSchema.safeParse([1, 1, 2]).success).toBe(false)
    })

    it("rejects more than 7 days", () => {
      expect(
        workingDaysSchema.safeParse([0, 1, 2, 3, 4, 5, 6, 0]).success
      ).toBe(false)
    })
  })

  describe("upsertTimetableSlotSchema", () => {
    const valid = {
      termId: CUID_A,
      dayOfWeek: 1,
      periodId: CUID_B,
      classId: CUID_C,
      teacherId: CUID_D,
      classroomId: CUID_A,
      weekOffset: 0,
    }

    it("accepts a complete slot", () => {
      expect(upsertTimetableSlotSchema.parse(valid)).toMatchObject(valid)
    })

    it("rejects when a required id is missing", () => {
      const { teacherId, ...missing } = valid
      void teacherId
      expect(upsertTimetableSlotSchema.safeParse(missing).success).toBe(false)
    })

    it("rejects an invalid CUID", () => {
      expect(
        upsertTimetableSlotSchema.safeParse({ ...valid, classId: "nope" })
          .success
      ).toBe(false)
    })
  })

  describe("deleteTimetableSlotSchema", () => {
    const valid = {
      termId: CUID_A,
      dayOfWeek: 3,
      periodId: CUID_B,
      classId: CUID_C,
      weekOffset: 1,
    }

    it("accepts a valid delete payload", () => {
      expect(deleteTimetableSlotSchema.parse(valid)).toMatchObject(valid)
    })

    it("rejects an out-of-range day", () => {
      expect(
        deleteTimetableSlotSchema.safeParse({ ...valid, dayOfWeek: 9 }).success
      ).toBe(false)
    })
  })

  describe("upsertSchoolWeekConfigSchema", () => {
    it("accepts a minimal valid config", () => {
      const result = upsertSchoolWeekConfigSchema.parse({
        termId: null,
        workingDays: [0, 1, 2, 3, 4],
      })
      expect(result.workingDays).toEqual([0, 1, 2, 3, 4])
    })

    it("rejects a lunch period after period 10", () => {
      expect(
        upsertSchoolWeekConfigSchema.safeParse({
          termId: null,
          workingDays: [0, 1, 2],
          defaultLunchAfterPeriod: 11,
        }).success
      ).toBe(false)
    })

    it("rejects extra-lunch-rule durations outside 15-60 minutes", () => {
      expect(
        upsertSchoolWeekConfigSchema.safeParse({
          termId: null,
          workingDays: [0, 1, 2],
          extraLunchRules: { "1": { afterPeriod: 3, duration: 5 } },
        }).success
      ).toBe(false)
    })
  })

  describe("getWeeklyTimetableSchema & suggestFreeSlotsSchema", () => {
    it("accepts a weekly-timetable query with an optional view", () => {
      const parsed = getWeeklyTimetableSchema.parse({
        termId: CUID_A,
        weekOffset: 1,
        view: { classId: CUID_B },
      })
      expect(parsed.termId).toBe(CUID_A)
    })

    it("requires a termId for weekly timetable", () => {
      expect(getWeeklyTimetableSchema.safeParse({}).success).toBe(false)
    })

    it("accepts suggest-free-slots with preferred days/periods", () => {
      const parsed = suggestFreeSlotsSchema.parse({
        termId: CUID_A,
        teacherId: CUID_B,
        preferredDays: [0, 1],
        preferredPeriods: [CUID_C],
      })
      expect(parsed.preferredDays).toEqual([0, 1])
    })
  })
})

describe("Timetable Validation Helpers (real source)", () => {
  describe("validateTimeSlot", () => {
    it("passes for a working day", () => {
      expect(validateTimeSlot(1, "p1", [0, 1, 2, 3, 4])).toBe(true)
    })

    it("throws for a non-working day", () => {
      expect(() => validateTimeSlot(5, "p1", [0, 1, 2, 3, 4])).toThrow(
        /not a working day/
      )
    })
  })

  describe("validateTeacherAvailability", () => {
    const existing = [{ teacherId: "t1", dayOfWeek: 1, periodId: "p1" }]

    it("passes when the teacher is free", () => {
      expect(validateTeacherAvailability("t1", 2, "p1", existing)).toBe(true)
    })

    it("throws when the teacher already has a class", () => {
      expect(() =>
        validateTeacherAvailability("t1", 1, "p1", existing)
      ).toThrow(/already has a class/)
    })
  })

  describe("validateRoomAvailability", () => {
    const existing = [{ classroomId: "r1", dayOfWeek: 1, periodId: "p1" }]

    it("passes when the room is free", () => {
      expect(validateRoomAvailability("r1", 2, "p1", existing)).toBe(true)
    })

    it("throws when the room is double-booked", () => {
      expect(() => validateRoomAvailability("r1", 1, "p1", existing)).toThrow(
        /already booked/
      )
    })
  })

  describe("validateSubjectDistribution", () => {
    it("is valid below the weekly cap", () => {
      const slots = [{ classId: "c1", subjectId: "s1" }]
      expect(validateSubjectDistribution("c1", "s1", slots).isValid).toBe(true)
    })

    it("is invalid once the cap is reached", () => {
      const slots = Array.from({ length: 6 }, () => ({
        classId: "c1",
        subjectId: "s1",
      }))
      const result = validateSubjectDistribution("c1", "s1", slots)
      expect(result.isValid).toBe(false)
      expect(result.message).toMatch(/max/)
    })

    it("respects a per-call override", () => {
      const slots = [
        { classId: "c1", subjectId: "s1" },
        { classId: "c1", subjectId: "s1" },
      ]
      expect(validateSubjectDistribution("c1", "s1", slots, 2).isValid).toBe(
        false
      )
    })
  })

  describe("validateTeacherTravelTime", () => {
    it("flags back-to-back classes in different rooms", () => {
      const existing = [
        {
          teacherId: "t1",
          dayOfWeek: 1,
          periodId: "p1",
          classroomId: "r1",
          periodOrder: 1,
        },
      ]
      const result = validateTeacherTravelTime("t1", 1, 2, "r2", existing)
      expect(result.isValid).toBe(false)
    })

    it("allows back-to-back classes in the same room", () => {
      const existing = [
        {
          teacherId: "t1",
          dayOfWeek: 1,
          periodId: "p1",
          classroomId: "r1",
          periodOrder: 1,
        },
      ]
      expect(
        validateTeacherTravelTime("t1", 1, 2, "r1", existing).isValid
      ).toBe(true)
    })
  })
})
