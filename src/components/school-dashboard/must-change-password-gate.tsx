// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import {
  ForceChangePasswordModal,
  type FirstLoginLabels,
} from "./force-change-password-modal"
import { SessionRevoked } from "./session-revoked"

/**
 * Renders the forced password-change modal when an admin reset left the user
 * with `mustChangePassword`, and signs out a session the reset revoked.
 *
 * Its own async component so the dashboard layouts can put it behind
 * `<Suspense fallback={null}>`: the lookup used to be awaited before the
 * layout returned, which held back the header, sidebar and page for one
 * database round trip on every render — including the re-render every
 * revalidating Server Action triggers. Now the page streams and the modal
 * arrives a moment later for the rare user who needs it.
 */
export async function MustChangePasswordGate({
  userId,
  lang,
  sessionTv,
}: {
  userId: string
  lang: string
  /** `session.user.tv` — absent on sessions minted before revocation shipped. */
  sessionTv?: number
}) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mustChangePassword: true, tokenVersion: true },
  })
  if (!user) return null
  // A reset since this session signed in revokes it (same read, no extra query).
  if (typeof sessionTv === "number" && sessionTv !== user.tokenVersion) {
    return <SessionRevoked lang={lang} />
  }
  if (!user.mustChangePassword) return null
  // Only the rare first-login render pays for the dictionary.
  const dictionary = await getDictionary(lang as Locale)
  const labels = (dictionary.auth as { firstLogin?: FirstLoginLabels })
    .firstLogin
  return <ForceChangePasswordModal labels={labels} />
}
