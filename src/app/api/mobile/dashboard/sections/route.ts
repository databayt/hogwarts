// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import {
  asDashboardSectionRole,
  loadInvoices,
  loadResourceUsage,
  resourcePercent,
} from "@/components/school-dashboard/dashboard/queries"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/dashboard/sections — the per-role sections the web renders
 * under the phone dashboard's blocks.
 *
 * Reads the very same loaders as the web's `ResourceUsageSection` and
 * `InvoiceHistorySection` (`dashboard/queries.ts`, shared with
 * `getResourceUsageByRole` / `getInvoicesByRole`), so a row that changes on the
 * web changes here in the same commit.
 *
 * Every role gets 200. A role the web renders no sections for — USER, or any
 * role outside the eight dashboard variants — gets two empty arrays rather than
 * the ADMIN fall-through, which for invoices would be the whole school's
 * billing.
 *
 * Returns {
 *   resource_usage [{ key, name, used, limit, unit, percent }],
 *   invoices [{ id, date, description, amount, currency, status }]
 * }
 *
 * `key` is the stable camelCase identifier under
 * `school.dashboard.resourceNames` in the dictionaries — localize by it and
 * fall back to `name`, the server's English label. `percent` is the number the
 * web's usage table prints in its last column: `Math.round(used / limit * 100)`,
 * unclamped, 0 when there is no limit.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const headers = { "Cache-Control": "private, no-store, max-age=0" }
    const role = asDashboardSectionRole(auth.role)
    if (!role) {
      return NextResponse.json(
        { resource_usage: [], invoices: [] },
        { headers }
      )
    }

    const viewer = { schoolId: auth.schoolId, userId: auth.userId }
    const [resources, invoices] = await Promise.all([
      loadResourceUsage(role, viewer),
      loadInvoices(role, viewer),
    ])

    return NextResponse.json(
      {
        resource_usage: resources.map((r) => ({
          key: r.key,
          name: r.name,
          used: r.used,
          limit: r.limit,
          unit: r.unit,
          percent: resourcePercent(r),
        })),
        invoices: invoices.map((inv) => ({
          id: inv.id,
          date: inv.date.toISOString(),
          description: inv.description,
          amount: inv.amount,
          currency: inv.currency,
          status: inv.status,
        })),
      },
      { headers }
    )
  } catch (error) {
    console.error("Mobile dashboard sections error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
