import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import TourBookingContent from "@/components/school-marketing/admission/tour/tour-booking-content"

// 1 hour — school marketing pages change infrequently
export const revalidate = 3600

interface TourPageProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({
  params,
}: TourPageProps): Promise<Metadata> {
  const { subdomain } = await params
  const schoolResult = await getSchoolBySubdomain(subdomain)

  if (!schoolResult.success || !schoolResult.data) {
    return { title: "Schedule Tour" }
  }

  return {
    title: `Schedule a Tour - ${schoolResult.data.name}`,
    description: `Schedule a campus tour at ${schoolResult.data.name}. See our facilities and meet our staff.`,
  }
}

export default async function TourPage({ params }: TourPageProps) {
  const { lang, subdomain } = await params
  // Parallelize independent async operations to avoid request waterfalls
  const [dictionary, schoolResult] = await Promise.all([
    getDictionary(lang),
    getSchoolBySubdomain(subdomain),
  ])

  if (!schoolResult.success || !schoolResult.data) {
    notFound()
  }

  const settings = await db.admissionSettings.findUnique({
    where: { schoolId: schoolResult.data.id },
    select: { tourDaysOfWeek: true },
  })
  const tourDaysOfWeek = (settings?.tourDaysOfWeek as number[] | null) ?? [
    0, 1, 2, 3, 4,
  ]

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <TourBookingContent
          school={schoolResult.data}
          dictionary={dictionary}
          lang={lang}
          subdomain={subdomain}
          tourDaysOfWeek={tourDaysOfWeek}
        />
      </div>
    </div>
  )
}
