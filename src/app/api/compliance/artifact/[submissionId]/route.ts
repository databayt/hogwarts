// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { checkCompliancePermission } from "@/components/school-dashboard/compliance/authorization"

export const dynamic = "force-dynamic"

interface Params {
  params: Promise<{ submissionId: string }>
}

/**
 * Authed download of a DRY_RUN CSV artifact.
 *
 * Multi-tenant: submission's `schoolId` must match the requester's tenant.
 * Permission: `download_artifact` (ADMIN/DEVELOPER/STAFF).
 *
 * Returns 410 Gone if the row exists but has no inline content (e.g., once we
 * migrate to object storage, this route will redirect to a signed S3 URL).
 */
export async function GET(_request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { schoolId } = await getTenantContext().catch(() => ({
    schoolId: null,
  }))
  if (!schoolId) {
    return NextResponse.json(
      { error: "Missing school context" },
      { status: 403 }
    )
  }

  const allowed = checkCompliancePermission(
    {
      userId: session.user.id,
      role: session.user.role as UserRole,
      schoolId,
    },
    "download_artifact"
  )
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { submissionId } = await params
  const submission = await db.complianceSubmission.findUnique({
    where: { id: submissionId },
    select: {
      schoolId: true,
      submissionDate: true,
      csvArtifactContent: true,
      csvArtifactUrl: true,
    },
  })

  if (!submission || submission.schoolId !== schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (submission.csvArtifactUrl) {
    // Once object storage is wired, prefer the signed URL.
    return NextResponse.redirect(submission.csvArtifactUrl)
  }
  if (!submission.csvArtifactContent) {
    return NextResponse.json({ error: "Artifact unavailable" }, { status: 410 })
  }

  const isoDate = submission.submissionDate.toISOString().slice(0, 10)
  return new NextResponse(submission.csvArtifactContent, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="esis-${isoDate}.csv"`,
      "cache-control": "no-store",
    },
  })
}
