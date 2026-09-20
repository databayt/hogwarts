// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

/**
 * The app calls a catalog subject a "course" and addresses it by the `id` the
 * catalog endpoints hand back. Slugs are accepted too, because
 * `/api/mobile/catalog/subjects/:slug` addresses the same row that way and a
 * caller holding one should not have to look the other up.
 *
 * The catalog is global — no `schoolId` — so this is deliberately not tenant
 * scoped. What IS tenant scoped is everything written against it: the
 * enrollment, the progress and the certificate all carry the token's school.
 */
export async function findCatalogSubject(courseId: string) {
  return db.subject.findFirst({
    where: {
      OR: [{ id: courseId }, { slug: courseId }],
      status: "PUBLISHED",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      currency: true,
    },
  })
}
