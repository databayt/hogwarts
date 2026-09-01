// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"

export interface SlideOption {
  id: string
  title: string
  /** Same-origin route; redirects to a signed URL with an inline disposition. */
  url: string
}

const PRESENTABLE = /pdf|presentation|powerpoint|image/i

/**
 * Documents the host can present in the room: the session's catalog
 * lesson's materials and attachments, under the same visibility rules the
 * file route enforces at fetch time (so the list never shows what the
 * viewer could not open).
 */
export async function getSlideOptions(
  schoolId: string,
  sessionId: string
): Promise<SlideOption[]> {
  const session = await db.conference.findFirst({
    where: { id: sessionId, schoolId, deletedAt: null },
    select: { catalogLessonId: true },
  })
  if (!session?.catalogLessonId) return []

  const [materials, attachments] = await Promise.all([
    db.material.findMany({
      where: {
        catalogLessonId: session.catalogLessonId,
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        OR: [{ visibility: "PUBLIC" }, { contributedSchoolId: schoolId }],
      },
      select: { id: true, title: true, mimeType: true, type: true },
      orderBy: { title: "asc" },
      take: 30,
    }),
    db.attachment.findMany({
      where: { catalogLessonId: session.catalogLessonId },
      select: { id: true, name: true, fileType: true },
      orderBy: { name: "asc" },
      take: 30,
    }),
  ])

  const out: SlideOption[] = []
  for (const m of materials) {
    if (
      m.mimeType &&
      !PRESENTABLE.test(m.mimeType) &&
      !PRESENTABLE.test(String(m.type))
    )
      continue
    out.push({
      id: m.id,
      title: m.title,
      url: `/api/lumos/file/material/${m.id}`,
    })
  }
  for (const a of attachments) {
    if (a.fileType && !PRESENTABLE.test(a.fileType)) continue
    out.push({
      id: a.id,
      title: a.name,
      url: `/api/lumos/file/attachment/${a.id}`,
    })
  }
  return out
}
