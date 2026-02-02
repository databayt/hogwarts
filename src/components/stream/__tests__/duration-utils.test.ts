import { describe, expect, it } from "vitest"

import {
  calculateTotalDuration,
  formatDuration,
  formatSeconds,
  formatVideoDuration,
} from "../shared/duration-utils"

describe("duration-utils", () => {
  describe("calculateTotalDuration", () => {
    it("should return 0 for empty chapters", () => {
      expect(calculateTotalDuration([])).toBe(0)
    })

    it("should sum durations from all lessons in all chapters", () => {
      const chapters = [
        { lessons: [{ duration: 10 }, { duration: 15 }] },
        { lessons: [{ duration: 20 }, { duration: null }] },
      ]
      expect(calculateTotalDuration(chapters)).toBe(45)
    })

    it("should handle null durations", () => {
      const chapters = [{ lessons: [{ duration: null }, { duration: null }] }]
      expect(calculateTotalDuration(chapters)).toBe(0)
    })

    it("should handle chapters with no lessons", () => {
      const chapters = [{ lessons: [] }, { lessons: [{ duration: 30 }] }]
      expect(calculateTotalDuration(chapters)).toBe(30)
    })
  })

  describe("formatDuration", () => {
    it("should return TBD for 0 minutes (English)", () => {
      expect(formatDuration(0, "en")).toBe("TBD")
    })

    it("should return غير محدد for 0 minutes (Arabic)", () => {
      expect(formatDuration(0, "ar")).toBe("غير محدد")
    })

    it("should format minutes only", () => {
      expect(formatDuration(45, "en")).toBe("45m")
    })

    it("should format hours only", () => {
      expect(formatDuration(120, "en")).toBe("2h")
    })

    it("should format hours and minutes", () => {
      expect(formatDuration(150, "en")).toBe("2h 30m")
    })

    it("should format in Arabic", () => {
      expect(formatDuration(45, "ar")).toBe("45 دقيقة")
      expect(formatDuration(120, "ar")).toBe("2 ساعة")
      expect(formatDuration(150, "ar")).toBe("2 ساعة 30 دقيقة")
    })
  })

  describe("formatVideoDuration", () => {
    it("should return empty string for 0 minutes", () => {
      expect(formatVideoDuration(0, "en")).toBe("")
    })

    it("should format minutes of video", () => {
      expect(formatVideoDuration(45, "en")).toBe("45 min of video")
    })

    it("should format 1 hour of video", () => {
      expect(formatVideoDuration(60, "en")).toBe("1 hour of video")
    })

    it("should format multiple hours of video", () => {
      expect(formatVideoDuration(180, "en")).toBe("3 hours of video")
    })

    it("should format hours and minutes of video", () => {
      expect(formatVideoDuration(150, "en")).toBe("2h 30m of video")
    })

    it("should format in Arabic", () => {
      expect(formatVideoDuration(45, "ar")).toBe("45 دقيقة من الفيديو")
      expect(formatVideoDuration(60, "ar")).toBe("ساعة من الفيديو")
      expect(formatVideoDuration(180, "ar")).toBe("3 ساعات من الفيديو")
    })
  })

  describe("formatSeconds", () => {
    it("should format seconds to MM:SS", () => {
      expect(formatSeconds(65)).toBe("1:05")
    })

    it("should format to HH:MM:SS when over an hour", () => {
      expect(formatSeconds(3665)).toBe("1:01:05")
    })

    it("should pad single digit minutes and seconds", () => {
      expect(formatSeconds(5)).toBe("0:05")
      expect(formatSeconds(3600 + 5)).toBe("1:00:05")
    })

    it("should handle 0 seconds", () => {
      expect(formatSeconds(0)).toBe("0:00")
    })
  })
})
