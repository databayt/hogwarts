"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { OperatorLeadForm } from "../form"

interface Props {
  dictionary?: Dictionary["sales"]
  lang: Locale
}

export function CreateLeadContent({ dictionary, lang }: Props) {
  const d = dictionary?.detail
  const title = d?.createTitle ?? dictionary?.form?.createTitle ?? "New lead"
  const subtitle =
    d?.createSubtitle ??
    "Capture a school, partner, or intro contact for the platform pipeline."
  const back = d?.back ?? "Back to leads"

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href={`/${lang}/sales`}>
          <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
          {back}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </CardHeader>
        <CardContent>
          <OperatorLeadForm mode="create" dictionary={dictionary} lang={lang} />
        </CardContent>
      </Card>
    </div>
  )
}
