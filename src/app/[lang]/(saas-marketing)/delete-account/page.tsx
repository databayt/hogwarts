// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { legalDocs } from "@/components/saas-marketing/legal/content"
import LegalContent from "@/components/saas-marketing/legal/legal-content"

// Static legal text: prerender, no per-request work.
export const revalidate = 86400

interface Props {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const d = legalDocs.deleteAccount[lang === "en" ? "en" : "ar"]
  return { title: d.metaTitle, description: d.metaDescription }
}

export default async function DeleteAccountPage({ params }: Props) {
  const { lang } = await params
  return <LegalContent doc="deleteAccount" lang={lang === "en" ? "en" : "ar"} />
}
