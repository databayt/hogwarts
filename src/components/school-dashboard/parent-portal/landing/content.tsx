// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"

import { ChildrenGrid } from "./children-grid"

interface Props {
  lang: Locale
}

export async function ParentLandingContent({ lang }: Props) {
  const isRTL = lang === "ar"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {isRTL ? "بوابة ولي الأمر" : "Parent Portal"}
          </h1>
          <p className="text-muted-foreground">
            {isRTL
              ? "اختر أحد أطفالك لمتابعة تقدمه الأكاديمي"
              : "Choose a child to follow their academic progress"}
          </p>
        </div>
        {/* Deep-link to the shared messaging route. The contacts list is
            already role-dispatched for GUARDIAN to `my_children_teachers`
            + `admin`, so no pre-selection is needed for the contact pool
            to be right. Pre-selecting a specific teacher requires a
            messaging-block query param that lands in a follow-up. */}
        <Button asChild variant="outline" size="sm">
          <Link href={`/${lang}/messages`}>
            <MessageCircle className="me-1 h-4 w-4" />
            {isRTL ? "مراسلة المعلمين" : "Message teachers"}
          </Link>
        </Button>
      </div>
      <ChildrenGrid lang={lang} />
    </div>
  )
}
