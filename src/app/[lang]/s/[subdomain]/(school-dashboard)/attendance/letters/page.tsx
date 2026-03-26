// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { LettersContent } from "@/components/school-dashboard/attendance/letters/content"

export const metadata = { title: "Dashboard: Compliance Letters" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang)

  if (!["ADMIN", "DEVELOPER"].includes(session?.user?.role ?? "")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2>Access Denied</h2>
        <p className="text-muted-foreground">
          Only administrators can generate compliance letters.
        </p>
      </div>
    )
  }

  return <LettersContent locale={lang} />
}
