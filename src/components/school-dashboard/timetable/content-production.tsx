"use client"

import "./print.css"

import { useParams } from "next/navigation"
import { SessionProvider } from "next-auth/react"

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { RoleRouter } from "./views"

interface Props {
  dictionary?: Dictionary["school"]
}

function TimetableContentInner({ dictionary }: Props) {
  const params = useParams()
  const lang = (params?.lang as Locale) || "en"

  return (
    <div className="space-y-6">
      {dictionary && <RoleRouter dictionary={dictionary} lang={lang} />}
    </div>
  )
}

export function TimetableContent({ dictionary }: Props) {
  return (
    <SessionProvider>
      <TimetableContentInner dictionary={dictionary} />
    </SessionProvider>
  )
}
