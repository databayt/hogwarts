import { describe, expect, it } from "vitest"

import {
  generateSlug,
  generateSlugPreview,
  isValidSlug,
} from "../shared/slug-utils"

describe("slug-utils", () => {
  describe("generateSlug", () => {
    it("should convert title to lowercase slug", () => {
      expect(generateSlug("Introduction to Python")).toBe(
        "introduction-to-python"
      )
    })

    it("should replace spaces with hyphens", () => {
      expect(generateSlug("Web Development 101")).toBe("web-development-101")
    })

    it("should remove special characters", () => {
      expect(generateSlug("Learn JavaScript!!! (Beginner)")).toBe(
        "learn-javascript-beginner"
      )
    })

    it("should trim whitespace", () => {
      expect(generateSlug("  Python Course  ")).toBe("python-course")
    })

    it("should handle Arabic text", () => {
      const slug = generateSlug("دورة البرمجة")
      expect(slug.length).toBeGreaterThan(0)
      // Slugify converts Arabic to transliterated form
    })

    it("should handle numbers", () => {
      expect(generateSlug("React 19 Tutorial")).toBe("react-19-tutorial")
    })

    it("should handle consecutive special characters", () => {
      expect(generateSlug("Learn---JavaScript")).toBe("learn-javascript")
    })
  })

  describe("isValidSlug", () => {
    it("should return true for valid slugs", () => {
      expect(isValidSlug("python-programming")).toBe(true)
      expect(isValidSlug("react-19")).toBe(true)
      expect(isValidSlug("course")).toBe(true)
      expect(isValidSlug("a")).toBe(true)
    })

    it("should return false for slugs with uppercase", () => {
      expect(isValidSlug("Python-Programming")).toBe(false)
    })

    it("should return false for slugs with spaces", () => {
      expect(isValidSlug("python programming")).toBe(false)
    })

    it("should return false for slugs with special characters", () => {
      expect(isValidSlug("python_programming")).toBe(false)
      expect(isValidSlug("python.programming")).toBe(false)
    })

    it("should return false for slugs starting with hyphen", () => {
      expect(isValidSlug("-python")).toBe(false)
    })

    it("should return false for slugs ending with hyphen", () => {
      expect(isValidSlug("python-")).toBe(false)
    })

    it("should return false for empty string", () => {
      expect(isValidSlug("")).toBe(false)
    })

    it("should return false for slugs with consecutive hyphens", () => {
      expect(isValidSlug("python--programming")).toBe(false)
    })
  })

  describe("generateSlugPreview", () => {
    it("should generate the same slug as generateSlug", () => {
      const title = "Introduction to Machine Learning"
      expect(generateSlugPreview(title)).toBe(generateSlug(title))
    })
  })
})
