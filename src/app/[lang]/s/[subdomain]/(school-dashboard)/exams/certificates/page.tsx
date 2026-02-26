// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Certificates Page
 * Main certificate management page
 */

import type { Locale } from "@/components/internationalization/config"
import { CertificateContent } from "@/components/school-dashboard/exams/certificates/content"

interface CertificatesPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function CertificatesPage({
  params,
}: CertificatesPageProps) {
  const { lang } = await params

  return <CertificateContent />
}
