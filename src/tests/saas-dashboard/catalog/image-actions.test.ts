// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  deleteCatalogImage,
  processAndUploadCatalogImage,
} from "@/components/catalog/image"
import {
  deleteCatalogThumbnail,
  uploadCatalogThumbnail,
} from "@/components/saas-dashboard/catalog/image-actions"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/components/saas-dashboard/lib/operator-auth", () => ({
  requireDeveloper: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    subject: { update: vi.fn(), findUnique: vi.fn() },
    chapter: { update: vi.fn(), findUnique: vi.fn() },
    lesson: { update: vi.fn(), findUnique: vi.fn() },
  },
}))

vi.mock("@/components/catalog/image", () => ({
  processAndUploadCatalogImage: vi.fn(),
  deleteCatalogImage: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

// ============================================================================
// Helpers
// ============================================================================

function mockDeveloperSession() {
  vi.mocked(requireDeveloper).mockResolvedValue({
    user: { id: "dev-1", role: "DEVELOPER" },
  } as any)
}

function mockAuthFailure() {
  vi.mocked(requireDeveloper).mockRejectedValue(
    new Error("Unauthorized: DEVELOPER role required")
  )
}

/**
 * Creates a File-like object with a working arrayBuffer() method.
 * jsdom's File/Blob lack arrayBuffer(), so we construct a shim manually.
 */
function makeImageFile(size = 1024, type = "image/png"): File {
  const bytes = new Uint8Array(size)
  const file = new File([bytes], "test.png", { type })

  // jsdom File/Blob lack arrayBuffer — polyfill with a FileReader-based shim
  if (typeof file.arrayBuffer !== "function") {
    ;(file as any).arrayBuffer = () =>
      new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.readAsArrayBuffer(file)
      })
  }
  return file
}

function makeImageFormData(file?: File) {
  const formData = new FormData()
  formData.set("file", file || makeImageFile())
  return formData
}

// ============================================================================
// Tests
// ============================================================================

describe("Image Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // uploadCatalogThumbnail
  // ==========================================================================

  describe("uploadCatalogThumbnail", () => {
    it("uploads for subject entity type", async () => {
      mockDeveloperSession()
      vi.mocked(processAndUploadCatalogImage).mockResolvedValue(
        "catalog/subjects/subj-1/thumbnail"
      )
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      const formData = makeImageFormData()
      const result = await uploadCatalogThumbnail(formData, "subject", "subj-1")

      expect(result).toEqual({
        status: "success",
        thumbnail: "catalog/subjects/subj-1/thumbnail",
      })
      expect(processAndUploadCatalogImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        "catalog/subjects/subj-1/thumbnail"
      )
      expect(db.subject.update).toHaveBeenCalledWith({
        where: { id: "subj-1" },
        data: { thumbnail: "catalog/subjects/subj-1/thumbnail" },
      })
    })

    it("uploads for chapter entity type", async () => {
      mockDeveloperSession()
      vi.mocked(processAndUploadCatalogImage).mockResolvedValue(
        "catalog/chapters/chap-1/thumbnail"
      )
      vi.mocked(db.chapter.update).mockResolvedValue({} as any)

      const formData = makeImageFormData()
      const result = await uploadCatalogThumbnail(formData, "chapter", "chap-1")

      expect(result).toEqual({
        status: "success",
        thumbnail: "catalog/chapters/chap-1/thumbnail",
      })
      expect(processAndUploadCatalogImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        "catalog/chapters/chap-1/thumbnail"
      )
      expect(db.chapter.update).toHaveBeenCalledWith({
        where: { id: "chap-1" },
        data: { thumbnail: "catalog/chapters/chap-1/thumbnail" },
      })
    })

    it("uploads for lesson entity type", async () => {
      mockDeveloperSession()
      vi.mocked(processAndUploadCatalogImage).mockResolvedValue(
        "catalog/lessons/les-1/thumbnail"
      )
      vi.mocked(db.lesson.update).mockResolvedValue({} as any)

      const formData = makeImageFormData()
      const result = await uploadCatalogThumbnail(formData, "lesson", "les-1")

      expect(result).toEqual({
        status: "success",
        thumbnail: "catalog/lessons/les-1/thumbnail",
      })
      expect(processAndUploadCatalogImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        "catalog/lessons/les-1/thumbnail"
      )
      expect(db.lesson.update).toHaveBeenCalledWith({
        where: { id: "les-1" },
        data: { thumbnail: "catalog/lessons/les-1/thumbnail" },
      })
    })

    it("returns error when no file provided", async () => {
      mockDeveloperSession()

      const formData = new FormData()
      const result = await uploadCatalogThumbnail(formData, "subject", "subj-1")

      expect(result).toEqual({
        status: "error",
        error: "No file provided",
      })
      expect(processAndUploadCatalogImage).not.toHaveBeenCalled()
    })

    it("returns error when file is not an image", async () => {
      mockDeveloperSession()

      const textFile = new File(["hello"], "doc.txt", {
        type: "text/plain",
      })
      const formData = makeImageFormData(textFile)
      const result = await uploadCatalogThumbnail(formData, "subject", "subj-1")

      expect(result).toEqual({
        status: "error",
        error: "File must be an image",
      })
      expect(processAndUploadCatalogImage).not.toHaveBeenCalled()
    })

    it("returns error when file exceeds 10MB", async () => {
      mockDeveloperSession()

      const largeFile = makeImageFile(11 * 1024 * 1024)
      const formData = makeImageFormData(largeFile)
      const result = await uploadCatalogThumbnail(formData, "subject", "subj-1")

      expect(result).toEqual({
        status: "error",
        error: "File too large (max 10MB)",
      })
      expect(processAndUploadCatalogImage).not.toHaveBeenCalled()
    })

    it("returns error on auth failure", async () => {
      mockAuthFailure()

      const formData = makeImageFormData()
      const result = await uploadCatalogThumbnail(formData, "subject", "subj-1")

      expect(result).toEqual({
        status: "error",
        error: "Unauthorized",
      })
      expect(processAndUploadCatalogImage).not.toHaveBeenCalled()
    })

    it("returns error on S3 upload failure", async () => {
      mockDeveloperSession()
      vi.mocked(processAndUploadCatalogImage).mockRejectedValue(
        new Error("S3 upload timeout")
      )

      const formData = makeImageFormData()
      const result = await uploadCatalogThumbnail(formData, "subject", "subj-1")

      expect(result).toEqual({
        status: "error",
        error: "S3 upload timeout",
      })
      expect(db.subject.update).not.toHaveBeenCalled()
    })

    it("stores thumbnail in the correct DB model for each entity type", async () => {
      mockDeveloperSession()
      vi.mocked(processAndUploadCatalogImage).mockResolvedValue(
        "catalog/chapters/chap-2/thumbnail"
      )
      vi.mocked(db.chapter.update).mockResolvedValue({} as any)

      const formData = makeImageFormData()
      await uploadCatalogThumbnail(formData, "chapter", "chap-2")

      // chapter update called, subject and lesson NOT called
      expect(db.chapter.update).toHaveBeenCalledTimes(1)
      expect(db.subject.update).not.toHaveBeenCalled()
      expect(db.lesson.update).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // deleteCatalogThumbnail
  // ==========================================================================

  describe("deleteCatalogThumbnail", () => {
    it("deletes for subject entity type", async () => {
      mockDeveloperSession()
      vi.mocked(db.subject.findUnique).mockResolvedValue({
        thumbnail: "catalog/subjects/subj-1/thumbnail",
      } as any)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)
      vi.mocked(deleteCatalogImage).mockResolvedValue(undefined)

      const result = await deleteCatalogThumbnail("subject", "subj-1")

      expect(result).toEqual({ status: "success" })
      expect(db.subject.findUnique).toHaveBeenCalledWith({
        where: { id: "subj-1" },
        select: { thumbnail: true },
      })
      expect(deleteCatalogImage).toHaveBeenCalledWith(
        "catalog/subjects/subj-1/thumbnail"
      )
      expect(db.subject.update).toHaveBeenCalledWith({
        where: { id: "subj-1" },
        data: { thumbnail: null },
      })
    })

    it("deletes for chapter entity type", async () => {
      mockDeveloperSession()
      vi.mocked(db.chapter.findUnique).mockResolvedValue({
        thumbnail: "catalog/chapters/chap-1/thumbnail",
      } as any)
      vi.mocked(db.chapter.update).mockResolvedValue({} as any)
      vi.mocked(deleteCatalogImage).mockResolvedValue(undefined)

      const result = await deleteCatalogThumbnail("chapter", "chap-1")

      expect(result).toEqual({ status: "success" })
      expect(db.chapter.findUnique).toHaveBeenCalledWith({
        where: { id: "chap-1" },
        select: { thumbnail: true },
      })
      expect(deleteCatalogImage).toHaveBeenCalledWith(
        "catalog/chapters/chap-1/thumbnail"
      )
      expect(db.chapter.update).toHaveBeenCalledWith({
        where: { id: "chap-1" },
        data: { thumbnail: null },
      })
    })

    it("deletes for lesson entity type", async () => {
      mockDeveloperSession()
      vi.mocked(db.lesson.findUnique).mockResolvedValue({
        thumbnail: "catalog/lessons/les-1/thumbnail",
      } as any)
      vi.mocked(db.lesson.update).mockResolvedValue({} as any)
      vi.mocked(deleteCatalogImage).mockResolvedValue(undefined)

      const result = await deleteCatalogThumbnail("lesson", "les-1")

      expect(result).toEqual({ status: "success" })
      expect(db.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: "les-1" },
        select: { thumbnail: true },
      })
      expect(deleteCatalogImage).toHaveBeenCalledWith(
        "catalog/lessons/les-1/thumbnail"
      )
      expect(db.lesson.update).toHaveBeenCalledWith({
        where: { id: "les-1" },
        data: { thumbnail: null },
      })
    })

    it("clears thumbnail in DB after S3 deletion", async () => {
      mockDeveloperSession()
      vi.mocked(db.subject.findUnique).mockResolvedValue({
        thumbnail: "catalog/subjects/subj-1/thumbnail",
      } as any)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)
      vi.mocked(deleteCatalogImage).mockResolvedValue(undefined)

      await deleteCatalogThumbnail("subject", "subj-1")

      expect(db.subject.update).toHaveBeenCalledWith({
        where: { id: "subj-1" },
        data: { thumbnail: null },
      })
    })

    it("handles missing thumbnail gracefully — skips S3 delete", async () => {
      mockDeveloperSession()
      vi.mocked(db.subject.findUnique).mockResolvedValue({
        thumbnail: null,
      } as any)
      vi.mocked(db.subject.update).mockResolvedValue({} as any)

      const result = await deleteCatalogThumbnail("subject", "subj-1")

      expect(result).toEqual({ status: "success" })
      expect(deleteCatalogImage).not.toHaveBeenCalled()
      // Still clears DB field
      expect(db.subject.update).toHaveBeenCalledWith({
        where: { id: "subj-1" },
        data: { thumbnail: null },
      })
    })

    it("returns error on auth failure", async () => {
      mockAuthFailure()

      const result = await deleteCatalogThumbnail("subject", "subj-1")

      expect(result).toEqual({
        status: "error",
        error: "Unauthorized",
      })
      expect(db.subject.findUnique).not.toHaveBeenCalled()
    })

    it("handles S3 delete failure gracefully — returns error", async () => {
      mockDeveloperSession()
      vi.mocked(db.subject.findUnique).mockResolvedValue({
        thumbnail: "catalog/subjects/subj-1/thumbnail",
      } as any)
      vi.mocked(deleteCatalogImage).mockRejectedValue(
        new Error("S3 delete failed")
      )

      const result = await deleteCatalogThumbnail("subject", "subj-1")

      expect(result).toEqual({
        status: "error",
        error: "S3 delete failed",
      })
    })

    it("returns error when entity findUnique fails", async () => {
      mockDeveloperSession()
      vi.mocked(db.lesson.findUnique).mockRejectedValue(
        new Error("Record not found")
      )

      const result = await deleteCatalogThumbnail("lesson", "les-999")

      expect(result).toEqual({
        status: "error",
        error: "Record not found",
      })
    })
  })
})
