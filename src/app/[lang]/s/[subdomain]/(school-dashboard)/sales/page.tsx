import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import SalesContent from "@/components/sales/content"
import type { Lead } from "@/components/sales/types"
import {
  generateDefaultMetadata,
  generateSchoolMetadata,
} from "@/components/school-marketing/metadata"
import { getCurrentDomain } from "@/components/school-marketing/utils"

interface SalesProps {
  params: Promise<{ subdomain: string; lang: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
}: SalesProps): Promise<Metadata> {
  const { subdomain, lang } = await params
  const result = await getSchoolBySubdomain(subdomain)
  const { rootDomain } = await getCurrentDomain()

  if (!result.success || !result.data) {
    return generateDefaultMetadata(rootDomain)
  }

  return {
    ...generateSchoolMetadata({
      school: result.data,
      subdomain,
      rootDomain,
    }),
    title: lang === "ar" ? "المبيعات | العملاء المحتملين" : "Sales | Leads",
  }
}

export default async function Sales({ params }: SalesProps) {
  // Parallelize independent async operations to avoid request waterfalls
  const { subdomain, lang } = await params
  const [dictionary, result] = await Promise.all([
    getDictionary(lang),
    getSchoolBySubdomain(subdomain),
  ])

  if (!result.success || !result.data) {
    notFound()
  }

  const school = result.data

  // Fetch initial leads for the school
  const { schoolId } = await getTenantContext()
  let initialLeads: Lead[] = []

  if (schoolId) {
    const leads = await db.lead.findMany({
      where: { schoolId },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Initial load limit
    })

    initialLeads = leads as Lead[]
  }

  return (
    <div
      className="school-content"
      data-school-id={school.id}
      data-subdomain={subdomain}
    >
      <SalesContent />
    </div>
  )
}
