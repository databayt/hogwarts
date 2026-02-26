// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import { FinanceDashboardContent } from "@/components/school-dashboard/finance/dashboard/content"

export const metadata: Metadata = {
  title: "Financial Dashboard | Finance",
  description:
    "Comprehensive financial overview and key performance indicators",
}

export default async function FinanceDashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return <FinanceDashboardContent lang={lang} />
}
