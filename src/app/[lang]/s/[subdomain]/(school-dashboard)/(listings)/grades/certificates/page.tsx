// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CertificateContent } from "@/components/school-dashboard/exams/certificates/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary.school.grades.navCertificates }
}

/**
 * Certificates are the last step of the grade workflow, so they live in the
 * grades hub too. Same screen as /exams/certificates — one implementation.
 */
export default async function GradeCertificatesPage({ params }: Props) {
  const { lang } = await params
  return <CertificateContent lang={lang} />
}
