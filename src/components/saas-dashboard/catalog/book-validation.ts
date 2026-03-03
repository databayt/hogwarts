// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const catalogBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  lang: z.string().default("ar"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().optional(),
  genre: z.string().min(1, "Genre is required"),
  description: z.string().optional(),
  summary: z.string().optional(),
  coverUrl: z.string().optional(),
  coverKey: z.string().optional(),
  coverColor: z.string().default("#000000"),
  publisher: z.string().optional(),
  publicationYear: z.number().int().optional(),
  language: z.string().default("ar"),
  pageCount: z.number().int().optional(),
  tags: z.array(z.string()).default([]),
  digitalFileUrl: z.string().optional(),
  digitalFileKey: z.string().optional(),
  digitalFileSize: z.number().int().optional(),
  digitalMimeType: z.string().optional(),
  videoUrl: z.string().optional(),
  status: z
    .enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED", "DEPRECATED"])
    .default("DRAFT"),
  visibility: z.enum(["PRIVATE", "SCHOOL", "PUBLIC", "PAID"]).default("PUBLIC"),
  approvalStatus: z
    .enum(["PENDING", "APPROVED", "REJECTED"])
    .default("PENDING"),
})

export type CatalogBookInput = z.infer<typeof catalogBookSchema>
