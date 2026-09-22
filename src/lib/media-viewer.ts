// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { NextRequest } from "next/server"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { authenticate, isAuthError } from "@/app/api/mobile/lib/authenticate"

/**
 * Who is asking for a protected lumos file: the web session (cookie + the
 * subdomain's school), else the mobile app's Bearer token (its own school).
 * The access checks that follow are the same for both — only identity
 * resolution differs. Null when neither is present.
 */
export async function resolveMediaViewer(
  request: NextRequest
): Promise<{ userId: string; role: string | undefined; schoolId: string | null } | null> {
  const session = await auth()
  if (session?.user?.id) {
    const { schoolId } = await getTenantContext()
    return { userId: session.user.id, role: session.user.role, schoolId }
  }
  if (!request.headers.get("authorization")) return null
  const mobile = await authenticate(request)
  if (isAuthError(mobile)) return null
  return { userId: mobile.userId, role: mobile.role, schoolId: mobile.schoolId }
}
