// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Presigned URL API — payment-proof upload (Bankak / Cashi / bank transfer).
 *
 * Sudan's rails have no merchant API (see src/lib/payment/providers/bankak.ts),
 * so a payer proves a transfer by uploading the confirmation screenshot from
 * their own banking app. This mints a short-lived presigned PUT so those bytes
 * never touch the server.
 *
 * Deliberately different from ../presign (the video route) in two ways:
 *  - Role gate: ANY authenticated user in the tenant may upload, because the
 *    whole point is that a parent files this, not staff. Ownership of the
 *    specific fee assignment is enforced later, by `submitManualPaymentProof`,
 *    which is what actually creates the Payment row — a stray object in S3
 *    with no Payment attached is inert.
 *  - Types/size: images + PDF at a few MB, not 5GB of video.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { getSubdomainFromHost } from "@/lib/root-domain"
import {
  getSchoolIdFromSubdomain,
  getTenantContext,
} from "@/lib/tenant-context"
import { presignUpload } from "@/lib/upload/presign"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    let { schoolId } = await getTenantContext()
    if (!schoolId) {
      // API routes sit outside the proxy's matcher, so no `x-subdomain`
      // header reaches here and `getTenantContext` falls back to the session.
      // An APPLICANT (role USER) has no school on their account yet — and the
      // offer page's registration-fee receipt upload is exactly who this
      // route serves — so resolve the school from the tenant host the
      // request arrived on. Ownership of the specific application is still
      // enforced by the action that records the proof (token-validated).
      const subdomain = getSubdomainFromHost(request.headers.get("host"))
      if (subdomain) {
        schoolId = await getSchoolIdFromSubdomain(subdomain)
      }
    }
    if (!schoolId) {
      return NextResponse.json(
        { error: "School context required" },
        { status: 400 }
      )
    }

    // Images + PDF up to 10MB under `payment-proof/<schoolId>/<assignment>/`
    // — the rules live in src/lib/upload/presign.ts.
    const body = (await request.json()) as {
      filename?: unknown
      contentType?: unknown
      size?: unknown
      feeAssignmentId?: string
    }
    const out = await presignUpload({
      kind: "payment_proof",
      schoolId,
      filename: body.filename,
      contentType: body.contentType,
      size: body.size,
      scope: body.feeAssignmentId,
    })
    if (!out.ok) {
      return NextResponse.json({ error: out.error }, { status: out.status })
    }

    return NextResponse.json({
      presignedUrl: out.presignedUrl,
      finalUrl: out.finalUrl,
      key: out.key,
      expiresIn: out.expiresIn,
    })
  } catch (error) {
    console.error("Payment-proof presign failed:", error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}
