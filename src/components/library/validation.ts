// Library Management System - Zod Validation Schemas

import { z } from "zod";

// Book validation schema
export const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  author: z.string().min(1, "Author is required").max(255, "Author name is too long"),
  genre: z.string().min(1, "Genre is required"),
  rating: z.number().min(0, "Rating must be at least 0").max(5, "Rating cannot exceed 5"),
  coverUrl: z.string().url("Must be a valid URL"),
  coverColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  totalCopies: z.number().min(1, "Must have at least 1 copy"),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
});

export type BookSchema = z.infer<typeof bookSchema>;

// Borrow book validation schema
export const borrowBookSchema = z.object({
  bookId: z.string().cuid("Invalid book ID"),
  userId: z.string().cuid("Invalid user ID"),
  schoolId: z.string().cuid("Invalid school ID"),
  dueDate: z.date().min(new Date(), "Due date must be in the future"),
});

export type BorrowBookSchema = z.infer<typeof borrowBookSchema>;

// Return book validation schema
export const returnBookSchema = z.object({
  borrowRecordId: z.string().cuid("Invalid borrow record ID"),
  schoolId: z.string().cuid("Invalid school ID"),
});

export type ReturnBookSchema = z.infer<typeof returnBookSchema>;

// Update book validation schema (allows partial updates)
export const updateBookSchema = bookSchema.partial().extend({
  id: z.string().cuid("Invalid book ID"),
  schoolId: z.string().cuid("Invalid school ID"),
});

export type UpdateBookSchema = z.infer<typeof updateBookSchema>;

// Delete book validation
export const deleteBookSchema = z.object({
  id: z.string().cuid("Invalid book ID"),
  schoolId: z.string().cuid("Invalid school ID"),
});

export type DeleteBookSchema = z.infer<typeof deleteBookSchema>;
