// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

import { ForceChangePasswordModal } from "./force-change-password-modal"

/**
 * Renders the forced password-change modal when an admin reset left the user
 * with `mustChangePassword`.
 *
 * Its own async component so the dashboard layouts can put it behind
 * `<Suspense fallback={null}>`: the lookup used to be awaited before the
 * layout returned, which held back the header, sidebar and page for one
 * database round trip on every render — including the re-render every
 * revalidating Server Action triggers. Now the page streams and the modal
 * arrives a moment later for the rare user who needs it.
 */
export async function MustChangePasswordGate({ userId }: { userId: string }) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mustChangePassword: true, password: true },
  })
  if (!user?.mustChangePassword) return null
  return <ForceChangePasswordModal hasPassword={!!user.password} />
}
