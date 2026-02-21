import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"

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

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <main>{children}</main>
    </div>
  )
}
