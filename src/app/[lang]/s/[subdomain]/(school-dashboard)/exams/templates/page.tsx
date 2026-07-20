// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import DocumentsContent from "@/components/school-dashboard/documents/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.school?.documents?.title }
}

export default async function ExamTemplatesPage({ params }: Props) {
  const { lang } = await params
  return (
    <DocumentsContent lang={lang} categories={["EXAM_PAPER", "CERTIFICATE"]} />
  )
}
