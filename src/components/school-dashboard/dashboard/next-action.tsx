// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { getUpcomingDataByRole } from "./actions"
import { NextActionCard } from "./next-action-client"
import { rankNextActions } from "./next-action-rank"

/**
 * Server half of the phone dashboard's next-action banner: read the role, pull
 * the same upcoming payload the Upcoming flip card already uses, rank it, and
 * hand the ordered list to the client for the rotation.
 *
 * Best-effort — an empty or failed read renders nothing rather than an empty
 * green banner announcing that there is nothing to announce.
 */
export async function NextAction({ locale }: { locale: string }) {
  let actions

  try {
    const session = await auth()
    const role = session?.user?.role
    const data = await getUpcomingDataByRole(role || "")
    actions = rankNextActions(role, data)
  } catch (error) {
    console.error("[NextAction] Error ranking actions:", error)
    return null
  }

  if (!actions?.length) return null

  return <NextActionCard actions={actions} locale={locale} />
}
