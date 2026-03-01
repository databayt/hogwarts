// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import ErrorBoundary from "@/components/school-marketing/apply/error-boundary"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ subdomain: string; lang: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; lang: string }>
}): Promise<Metadata> {
  const { subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain)

  return {
    title: result.data ? `Join ${result.data.name}` : "Join School",
  }
}

export default async function SchoolOnboardLayout({
  children,
  params,
}: Readonly<LayoutProps>) {
  const { subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success) {
    if (result.errorType === "db_error") {
      throw new Error("Database temporarily unavailable")
    }
    notFound()
  }

  return (
    <div className="min-h-screen">
      <main>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  )
}
