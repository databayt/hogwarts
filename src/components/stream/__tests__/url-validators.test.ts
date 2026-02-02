import { describe, expect, it } from "vitest"

import {
  getVideoEmbedUrl,
  isValidDocumentUrl,
  isValidImageUrl,
  isValidVideoUrl,
  validateMediaUrl,
} from "../shared/url-validators"

describe("url-validators", () => {
  describe("isValidVideoUrl", () => {
    it("should return true for MP4 files", () => {
      expect(isValidVideoUrl("https://example.com/video.mp4")).toBe(true)
    })

    it("should return true for WebM files", () => {
      expect(isValidVideoUrl("https://example.com/video.webm")).toBe(true)
    })

    it("should return true for YouTube URLs", () => {
      expect(
        isValidVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBe(true)
      expect(isValidVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true)
    })

    it("should return true for Vimeo URLs", () => {
      expect(isValidVideoUrl("https://vimeo.com/123456789")).toBe(true)
    })

    it("should return true for CDN URLs", () => {
      expect(isValidVideoUrl("https://cdn.databayt.org/video.mp4")).toBe(true)
      expect(isValidVideoUrl("https://d123.cloudfront.net/video.mp4")).toBe(
        true
      )
    })

    it("should return false for invalid URLs", () => {
      expect(isValidVideoUrl("not-a-url")).toBe(false)
      expect(isValidVideoUrl("")).toBe(false)
    })

    it("should return false for non-video URLs", () => {
      expect(isValidVideoUrl("https://example.com/image.jpg")).toBe(false)
    })
  })

  describe("isValidImageUrl", () => {
    it("should return true for JPG files", () => {
      expect(isValidImageUrl("https://example.com/image.jpg")).toBe(true)
      expect(isValidImageUrl("https://example.com/image.jpeg")).toBe(true)
    })

    it("should return true for PNG files", () => {
      expect(isValidImageUrl("https://example.com/image.png")).toBe(true)
    })

    it("should return true for WebP files", () => {
      expect(isValidImageUrl("https://example.com/image.webp")).toBe(true)
    })

    it("should return true for SVG files", () => {
      expect(isValidImageUrl("https://example.com/icon.svg")).toBe(true)
    })

    it("should return true for CDN URLs", () => {
      expect(isValidImageUrl("https://images.unsplash.com/photo-123")).toBe(
        true
      )
      expect(
        isValidImageUrl("https://res.cloudinary.com/demo/image/upload/sample")
      ).toBe(true)
    })

    it("should return false for non-image URLs", () => {
      expect(isValidImageUrl("https://example.com/video.mp4")).toBe(false)
    })
  })

  describe("isValidDocumentUrl", () => {
    it("should return true for PDF files", () => {
      expect(isValidDocumentUrl("https://example.com/doc.pdf")).toBe(true)
    })

    it("should return true for DOC/DOCX files", () => {
      expect(isValidDocumentUrl("https://example.com/doc.doc")).toBe(true)
      expect(isValidDocumentUrl("https://example.com/doc.docx")).toBe(true)
    })

    it("should return true for PPT/PPTX files", () => {
      expect(isValidDocumentUrl("https://example.com/slides.ppt")).toBe(true)
      expect(isValidDocumentUrl("https://example.com/slides.pptx")).toBe(true)
    })

    it("should return false for non-document URLs", () => {
      expect(isValidDocumentUrl("https://example.com/image.jpg")).toBe(false)
    })
  })

  describe("validateMediaUrl", () => {
    it("should return valid for empty URL", () => {
      expect(validateMediaUrl("", "video")).toEqual({ valid: true })
    })

    it("should return error for invalid URL format", () => {
      const result = validateMediaUrl("not-a-url", "video")
      expect(result.valid).toBe(false)
      expect(result.error).toBe("Invalid URL format")
    })

    it("should validate video URLs", () => {
      const validResult = validateMediaUrl(
        "https://example.com/video.mp4",
        "video"
      )
      expect(validResult.valid).toBe(true)

      const invalidResult = validateMediaUrl(
        "https://example.com/image.jpg",
        "video"
      )
      expect(invalidResult.valid).toBe(false)
    })

    it("should validate image URLs", () => {
      const validResult = validateMediaUrl(
        "https://example.com/image.png",
        "image"
      )
      expect(validResult.valid).toBe(true)

      const invalidResult = validateMediaUrl(
        "https://example.com/video.mp4",
        "image"
      )
      expect(invalidResult.valid).toBe(false)
    })
  })

  describe("getVideoEmbedUrl", () => {
    it("should convert YouTube watch URL to embed URL", () => {
      expect(
        getVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ")
    })

    it("should convert YouTube short URL to embed URL", () => {
      expect(getVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
        "https://www.youtube.com/embed/dQw4w9WgXcQ"
      )
    })

    it("should convert Vimeo URL to embed URL", () => {
      expect(getVideoEmbedUrl("https://vimeo.com/123456789")).toBe(
        "https://player.vimeo.com/video/123456789"
      )
    })

    it("should convert Loom URL to embed URL", () => {
      expect(getVideoEmbedUrl("https://www.loom.com/share/abc123")).toBe(
        "https://www.loom.com/embed/abc123"
      )
    })

    it("should return direct video URLs as-is", () => {
      expect(getVideoEmbedUrl("https://example.com/video.mp4")).toBe(
        "https://example.com/video.mp4"
      )
    })

    it("should return null for empty URL", () => {
      expect(getVideoEmbedUrl("")).toBeNull()
    })
  })
})
