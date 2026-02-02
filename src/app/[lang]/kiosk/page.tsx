/**
 * Kiosk Page
 *
 * Main entry point for self-service attendance kiosk.
 * Handles kiosk initialization and student check-in/out.
 */
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import { KioskContent } from "@/components/platform/attendance/kiosk/content"

interface KioskPageProps {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ kioskId?: string }>
}

export default async function KioskPage({
  params,
  searchParams,
}: KioskPageProps) {
  const { lang } = await params
  const { kioskId } = await searchParams

  // Get school from subdomain
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const subdomain = host.split(".")[0]

  // Find school by subdomain
  const school = await db.school.findFirst({
    where: { domain: subdomain, isActive: true },
    select: { id: true, name: true, logoUrl: true, timezone: true },
  })

  if (!school) {
    redirect(`/${lang}/404`)
  }

  // Get or create kiosk session
  let kioskSession = null
  if (kioskId) {
    kioskSession = await db.kioskSession.findUnique({
      where: {
        schoolId_kioskId: {
          schoolId: school.id,
          kioskId,
        },
      },
    })
  }

  return (
    <KioskContent
      schoolId={school.id}
      schoolName={school.name}
      schoolLogo={school.logoUrl}
      kioskId={kioskId || undefined}
      kioskSession={kioskSession}
      locale={lang}
    />
  )
}
