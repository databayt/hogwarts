// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { Archive } from "lucide-react"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: `${dictionary.school.announcements.navArchived} - ${dictionary.school.announcements.title}`,
    description: dictionary.school.announcements.description,
  }
}

export default async function AnnouncementsArchivedPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.announcements

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 rounded-full p-4">
        <Archive className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="font-medium">{d?.navArchived || "Archived"}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        {d?.noContent || "No content"}
      </p>
    </div>
  )
}
