// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { LumosCertificateContent } from "@/components/lumos/courses/[slug]/certificate/content"
import { getSubjectCertificate } from "@/components/lumos/data/catalog/get-certificate"
import { getLabels } from "@/components/translation/person"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary.lumos?.certificate?.title || "Certificate of Completion",
  }
}

export default async function LumosCertificatePage({ params }: Props) {
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

  // `subjectTitle` is a snapshot taken in the catalog's storage language when
  // the certificate was issued, so it does not follow the reader's locale on
  // its own. One cached, batched lookup; a provider failure falls back to the
  // stored text rather than blocking the page.
  const displayTitle = certificate.schoolId
    ? ((
        await getLabels(
          [certificate.subjectTitle],
          lang === "ar" ? "ar" : "en",
          certificate.schoolId
        )
      ).get(certificate.subjectTitle) ?? certificate.subjectTitle)
    : certificate.subjectTitle

  return (
    <LumosCertificateContent
      dictionary={dictionary.lumos || {}}
      lang={lang}
      certificate={certificate}
      displayTitle={displayTitle}
    />
  )
}
