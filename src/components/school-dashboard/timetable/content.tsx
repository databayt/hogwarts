"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "./print.css"

import { useParams } from "next/navigation"
import { SessionProvider } from "next-auth/react"

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { RoleRouter } from "./views"

interface Props {
  dictionary?: Dictionary["school"]
  defaultTab?: "today" | "full"
  /** Session-derived: will this reader land on `StudentView`? Shapes the
   *  loading placeholder, which renders before any role is knowable client-side. */
  studentShell?: boolean
}

function TimetableContentInner({
  dictionary,
  defaultTab,
  studentShell,
}: Props) {
  const params = useParams()
  const lang = (params?.lang as Locale) || "en"

  return (
    <div className="space-y-6">
      {dictionary && (
        <RoleRouter
          dictionary={dictionary}
          lang={lang}
          defaultTab={defaultTab}
          studentShell={studentShell}
        />
      )}
    </div>
  )
}

export function TimetableContent({
  dictionary,
  defaultTab,
  studentShell,
}: Props) {
  return (
    <SessionProvider>
      <TimetableContentInner
        dictionary={dictionary}
        defaultTab={defaultTab}
        studentShell={studentShell}
      />
    </SessionProvider>
  )
}
