// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

/**
 * Report-card templates are no longer built with an in-app wizard. Schools now
 * upload their own `.docx` template (category REPORT_CARD) under Documents and
 * the report-cards screen fills it via "Generate (my template)". This route is
 * kept only to redirect the existing "Templates" nav entry to that flow.
 */
export default async function GradeTemplatePage({ params }: Props) {
  const { lang } = await params
  redirect(`/${lang}/documents`)
}
