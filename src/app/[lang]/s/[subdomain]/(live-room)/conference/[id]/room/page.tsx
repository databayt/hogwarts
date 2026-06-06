// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { joinLiveClass } from "@/components/school-dashboard/conference/actions/tokens"
import { resolveLiveClassError } from "@/components/school-dashboard/conference/error-map"
import { RoomClient } from "@/components/school-dashboard/conference/room"

// Page-data OOM safety: auth-gated room, render on demand.
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function Page({ params }: Props) {
  const [{ lang, id }, session] = await Promise.all([params, auth()])
  if (!session?.user?.id) {
    redirect(`/${lang}/login`)
  }

  const dictionary = await getDictionary(lang)
  const result = await joinLiveClass(id)

  const t = dictionary?.liveClasses

  if (!("success" in result) || !result.success) {
    const code = "error" in result ? result.error : undefined
    return (
      <div className="bg-background flex h-screen w-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-destructive text-base font-medium">
          {resolveLiveClassError(dictionary, code)}
        </p>
        <a className="text-sm underline" href={`/${lang}/conference/${id}`}>
          {t?.actions?.back ?? "Back"}
        </a>
      </div>
    )
  }

  return (
    <RoomClient
      initialTicket={result.data}
      sessionId={id}
      locale={lang}
      labels={{
        leaving: t?.room?.leave ?? "Leave",
        reconnecting: t?.room?.reconnecting ?? "Reconnecting…",
        error: t?.errors?.tokenExpired ?? "Token expired. Please rejoin.",
      }}
    />
  )
}
