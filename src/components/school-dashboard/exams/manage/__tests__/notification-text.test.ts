// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  examCancelledNotification,
  examScheduledNotification,
} from "../notification-text"

describe("exam notification copy — lang-aware (no hardcoded Arabic)", () => {
  const date = new Date("2026-06-15T00:00:00.000Z")

  describe("examScheduledNotification", () => {
    it("returns Arabic copy for an Arabic-preferring school", () => {
      const n = examScheduledNotification("Midterm", date, "ar")
      expect(n.title).toBe("امتحان جديد")
      expect(n.body).toContain("Midterm")
      expect(n.body).toContain("تم جدولة")
    })

    it("returns English copy for an English-preferring school", () => {
      const n = examScheduledNotification("Midterm", date, "en")
      expect(n.title).toBe("New Exam")
      expect(n.body).toContain('Exam "Midterm" scheduled for')
      // must not contain Arabic characters
      expect(/[؀-ۿ]/.test(n.body)).toBe(false)
    })
  })

  describe("examCancelledNotification", () => {
    it("returns Arabic copy with optional reason appended", () => {
      const n = examCancelledNotification("Final", "ar", "Weather")
      expect(n.title).toBe("إلغاء امتحان")
      expect(n.body).toContain("Final")
      expect(n.body).toContain("Weather")
    })

    it("returns English copy and omits the reason when absent", () => {
      const n = examCancelledNotification("Final", "en")
      expect(n.title).toBe("Exam Cancelled")
      expect(n.body).toBe('Exam "Final" has been cancelled')
      expect(/[؀-ۿ]/.test(n.title)).toBe(false)
    })
  })
})
