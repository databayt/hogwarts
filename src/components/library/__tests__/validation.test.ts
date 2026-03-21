// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  bookSchema,
  borrowBookSchema,
  deleteBookSchema,
  returnBookSchema,
  updateBookSchema,
} from "../validation"

// Valid CUID for testing (matches Prisma's cuid format)
const VALID_CUID = "clh2v0o3h0000qwer1234abcd"
const VALID_CUID_2 = "clh2v0o3h0001qwer5678efgh"
const VALID_CUID_3 = "clh2v0o3h0002qwer9012ijkl"

function makeValidBook() {
  return {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic Fiction",
    rating: 4.5,
    coverUrl: "https://example.com/cover.jpg",
    coverColor: "#FF5733",
    description: "A classic novel about the American Dream",
    totalCopies: 5,
    videoUrl: "https://example.com/trailer.mp4",
    summary: "Set in the Jazz Age, this novel tells the story of Jay Gatsby",
    isbn: "978-0-7432-7356-5",
    publisher: "Scribner",
    publicationYear: 1925,
    language: "English",
    pageCount: 180,
  }
}

describe("Library Validation", () => {
  describe("bookSchema", () => {
    it("accepts valid complete input", () => {
      const result = bookSchema.safeParse(makeValidBook())

      expect(result.success).toBe(true)
    })

    it("rejects empty title", () => {
      const data = { ...makeValidBook(), title: "" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const titleError = result.error.issues.find(
          (i) => i.path[0] === "title"
        )
        expect(titleError).toBeDefined()
      }
    })

    it("rejects empty author", () => {
      const data = { ...makeValidBook(), author: "" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const authorError = result.error.issues.find(
          (i) => i.path[0] === "author"
        )
        expect(authorError).toBeDefined()
      }
    })

    it("rejects empty genre", () => {
      const data = { ...makeValidBook(), genre: "" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const genreError = result.error.issues.find(
          (i) => i.path[0] === "genre"
        )
        expect(genreError).toBeDefined()
      }
    })

    it("rejects rating below 0", () => {
      const data = { ...makeValidBook(), rating: -1 }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const ratingError = result.error.issues.find(
          (i) => i.path[0] === "rating"
        )
        expect(ratingError).toBeDefined()
      }
    })

    it("rejects rating above 5", () => {
      const data = { ...makeValidBook(), rating: 6 }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const ratingError = result.error.issues.find(
          (i) => i.path[0] === "rating"
        )
        expect(ratingError).toBeDefined()
      }
    })

    it("accepts rating at boundaries (0 and 5)", () => {
      const dataMin = { ...makeValidBook(), rating: 0 }
      const dataMax = { ...makeValidBook(), rating: 5 }

      expect(bookSchema.safeParse(dataMin).success).toBe(true)
      expect(bookSchema.safeParse(dataMax).success).toBe(true)
    })

    it("rejects invalid URL for coverUrl", () => {
      const data = { ...makeValidBook(), coverUrl: "not-a-url" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const urlError = result.error.issues.find(
          (i) => i.path[0] === "coverUrl"
        )
        expect(urlError).toBeDefined()
      }
    })

    it("rejects invalid hex color", () => {
      const data = { ...makeValidBook(), coverColor: "red" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const colorError = result.error.issues.find(
          (i) => i.path[0] === "coverColor"
        )
        expect(colorError).toBeDefined()
      }
    })

    it("rejects hex color without hash", () => {
      const data = { ...makeValidBook(), coverColor: "FF5733" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("rejects 3-digit hex color", () => {
      const data = { ...makeValidBook(), coverColor: "#F53" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("accepts lowercase hex color", () => {
      const data = { ...makeValidBook(), coverColor: "#ff5733" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("rejects description shorter than 10 characters", () => {
      const data = { ...makeValidBook(), description: "Short" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const descError = result.error.issues.find(
          (i) => i.path[0] === "description"
        )
        expect(descError).toBeDefined()
      }
    })

    it("rejects totalCopies less than 1", () => {
      const data = { ...makeValidBook(), totalCopies: 0 }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const copiesError = result.error.issues.find(
          (i) => i.path[0] === "totalCopies"
        )
        expect(copiesError).toBeDefined()
      }
    })

    it("accepts optional fields when omitted", () => {
      const data = {
        title: "Minimal Book",
        author: "Author Name",
        genre: "Fiction",
        rating: 3,
        coverUrl: "https://example.com/cover.jpg",
        coverColor: "#AABBCC",
        description: "A sufficiently long description for validation",
        totalCopies: 1,
        summary: "A sufficiently long summary for validation",
      }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("accepts empty string for optional videoUrl", () => {
      const data = { ...makeValidBook(), videoUrl: "" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("accepts empty string for optional isbn", () => {
      const data = { ...makeValidBook(), isbn: "" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("accepts empty string for optional publisher", () => {
      const data = { ...makeValidBook(), publisher: "" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("accepts empty string for optional language", () => {
      const data = { ...makeValidBook(), language: "" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("rejects title exceeding 255 characters", () => {
      const data = { ...makeValidBook(), title: "a".repeat(256) }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("rejects author exceeding 255 characters", () => {
      const data = { ...makeValidBook(), author: "a".repeat(256) }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("rejects summary shorter than 10 characters", () => {
      const data = { ...makeValidBook(), summary: "Short" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("rejects invalid videoUrl when provided", () => {
      const data = { ...makeValidBook(), videoUrl: "not-a-url" }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("rejects publicationYear below 1000", () => {
      const data = { ...makeValidBook(), publicationYear: 999 }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("rejects publicationYear above 2100", () => {
      const data = { ...makeValidBook(), publicationYear: 2101 }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("rejects pageCount less than 1", () => {
      const data = { ...makeValidBook(), pageCount: 0 }
      const result = bookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })
  })

  describe("borrowBookSchema", () => {
    it("accepts valid CUIDs and future date", () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 14)

      const data = {
        bookId: VALID_CUID,
        userId: VALID_CUID_2,
        schoolId: VALID_CUID_3,
        dueDate: futureDate,
      }
      const result = borrowBookSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("rejects invalid bookId", () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 14)

      const data = {
        bookId: "not-a-cuid",
        userId: VALID_CUID_2,
        schoolId: VALID_CUID_3,
        dueDate: futureDate,
      }
      const result = borrowBookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const bookIdError = result.error.issues.find(
          (i) => i.path[0] === "bookId"
        )
        expect(bookIdError).toBeDefined()
      }
    })

    it("rejects invalid userId", () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 14)

      const data = {
        bookId: VALID_CUID,
        userId: "invalid",
        schoolId: VALID_CUID_3,
        dueDate: futureDate,
      }
      const result = borrowBookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const userIdError = result.error.issues.find(
          (i) => i.path[0] === "userId"
        )
        expect(userIdError).toBeDefined()
      }
    })

    it("rejects invalid schoolId", () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 14)

      const data = {
        bookId: VALID_CUID,
        userId: VALID_CUID_2,
        schoolId: "bad-id",
        dueDate: futureDate,
      }
      const result = borrowBookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const schoolIdError = result.error.issues.find(
          (i) => i.path[0] === "schoolId"
        )
        expect(schoolIdError).toBeDefined()
      }
    })
  })

  describe("returnBookSchema", () => {
    it("accepts valid borrowRecordId and schoolId", () => {
      const data = {
        borrowRecordId: VALID_CUID,
        schoolId: VALID_CUID_2,
      }
      const result = returnBookSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("rejects invalid borrowRecordId", () => {
      const data = {
        borrowRecordId: "not-valid",
        schoolId: VALID_CUID_2,
      }
      const result = returnBookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.issues.find(
          (i) => i.path[0] === "borrowRecordId"
        )
        expect(error).toBeDefined()
      }
    })

    it("rejects invalid schoolId", () => {
      const data = {
        borrowRecordId: VALID_CUID,
        schoolId: "bad",
      }
      const result = returnBookSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path[0] === "schoolId")
        expect(error).toBeDefined()
      }
    })

    it("rejects missing fields", () => {
      const result = returnBookSchema.safeParse({})

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2)
      }
    })
  })

  describe("updateBookSchema", () => {
    it("allows partial book fields with required id and schoolId", () => {
      const data = {
        id: VALID_CUID,
        schoolId: VALID_CUID_2,
        title: "Updated Title",
      }
      const result = updateBookSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("accepts only id and schoolId with no book fields", () => {
      const data = {
        id: VALID_CUID,
        schoolId: VALID_CUID_2,
      }
      const result = updateBookSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("accepts full book fields with id and schoolId", () => {
      const data = {
        id: VALID_CUID,
        schoolId: VALID_CUID_2,
        ...makeValidBook(),
      }
      const result = updateBookSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("rejects missing id", () => {
      const data = {
        schoolId: VALID_CUID_2,
        title: "Updated Title",
      }
      const result = updateBookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("rejects missing schoolId", () => {
      const data = {
        id: VALID_CUID,
        title: "Updated Title",
      }
      const result = updateBookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("rejects invalid id format", () => {
      const data = {
        id: "not-a-cuid",
        schoolId: VALID_CUID_2,
        title: "Updated Title",
      }
      const result = updateBookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("still validates provided book fields", () => {
      const data = {
        id: VALID_CUID,
        schoolId: VALID_CUID_2,
        rating: 10, // exceeds max of 5
      }
      const result = updateBookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })
  })

  describe("deleteBookSchema", () => {
    it("accepts valid id and schoolId", () => {
      const data = {
        id: VALID_CUID,
        schoolId: VALID_CUID_2,
      }
      const result = deleteBookSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it("rejects missing id", () => {
      const data = {
        schoolId: VALID_CUID_2,
      }
      const result = deleteBookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("rejects missing schoolId", () => {
      const data = {
        id: VALID_CUID,
      }
      const result = deleteBookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("rejects invalid id format", () => {
      const data = {
        id: "invalid",
        schoolId: VALID_CUID_2,
      }
      const result = deleteBookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it("rejects invalid schoolId format", () => {
      const data = {
        id: VALID_CUID,
        schoolId: "invalid",
      }
      const result = deleteBookSchema.safeParse(data)

      expect(result.success).toBe(false)
    })
  })
})
