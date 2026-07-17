// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cache } from "react"

import { db } from "@/lib/db"

/**
 * Fetches the signed-in user's completion certificate for a catalog subject.
 *
 * Server-only + `cache()` (NOT "use server") per the block convention: this is
 * imported by a server component, never called from the browser, so taking
 * `userId` as an argument is safe — the page resolves it from `auth()`.
 *
 * Scoped by `userId` so a certificate can only ever be read by its owner;
 * `SubjectCertificate` is unique on (userId, catalogSubjectId).
 */
export const getSubjectCertificate = cache(async function getSubjectCertificate(
  slug: string,
  userId: string
) {
  const subject = await db.subject.findFirst({
    where: { slug },
    select: { id: true },
  })
  if (!subject) return null

  const certificate = await db.subjectCertificate.findUnique({
    where: {
      userId_catalogSubjectId: { userId, catalogSubjectId: subject.id },
    },
    select: {
      certificateNumber: true,
      subjectTitle: true,
      completedAt: true,
      issuedAt: true,
      // `User` has no `name` column — the completion email uses `username`
      // for the learner, so the certificate matches it.
      user: { select: { username: true } },
      school: { select: { name: true } },
    },
  })

  return certificate
})
