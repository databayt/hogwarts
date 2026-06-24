// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { DocumentTemplateCategory } from "@prisma/client"

import { resolveCertificateData } from "./certificate"
import { resolveExamPaperData } from "./exam-paper"
import type { ResolverCtx } from "./util"

export type { ResolverCtx } from "./util"

/**
 * Resolve the merge data for `entityId` according to the template `category`.
 * Add a `case` (and a resolver under `resolvers/`) to support more categories.
 */
export async function resolveDocumentData(
  category: DocumentTemplateCategory,
  entityId: string,
  ctx: ResolverCtx
): Promise<Record<string, unknown>> {
  switch (category) {
    case "CERTIFICATE":
      return resolveCertificateData(entityId, ctx)
    case "EXAM_PAPER":
      return resolveExamPaperData(entityId, ctx)
    default:
      throw new Error(`No data resolver for document category: ${category}`)
  }
}

/** Categories that can currently be generated (have a resolver wired). */
export const RESOLVABLE_CATEGORIES: DocumentTemplateCategory[] = [
  "CERTIFICATE",
  "EXAM_PAPER",
]
