// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { StreamCertificateContent } from "@/components/stream/courses/[slug]/certificate/content"
import { getSubjectCertificate } from "@/components/stream/data/catalog/get-certificate"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary.stream?.certificate?.title || "Certificate of Completion",
  }
}

export default async function StreamCertificatePage({ params }: Props) {
  const { lang, slug } = await params
  const [dictionary, session] = await Promise.all([getDictionary(lang), auth()])

  if (!session?.user?.id) {
    redirect(`/${lang}/login`)
  }

  // Scoped to the signed-in user: a certificate is only ever readable by the
  // learner who earned it. No certificate (not completed / not theirs) → 404.
  const certificate = await getSubjectCertificate(slug, session.user.id)
  if (!certificate) {
    notFound()
  }

  return (
    <StreamCertificateContent
      dictionary={dictionary.stream || {}}
      lang={lang}
      certificate={certificate}
    />
  )
}
