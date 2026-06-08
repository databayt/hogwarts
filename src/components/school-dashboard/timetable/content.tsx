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
}

function TimetableContentInner({ dictionary, defaultTab }: Props) {
  const params = useParams()
  const lang = (params?.lang as Locale) || "en"

  return (
    <div className="space-y-6">
      {dictionary && (
        <RoleRouter
          dictionary={dictionary}
          lang={lang}
          defaultTab={defaultTab}
        />
      )}
    </div>
  )
}

export function TimetableContent({ dictionary, defaultTab }: Props) {
  return (
    <SessionProvider>
      <TimetableContentInner dictionary={dictionary} defaultTab={defaultTab} />
    </SessionProvider>
  )
}
