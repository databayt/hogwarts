import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getTenantContext } from "@/components/operator/lib/tenant"
import ProfileContent from "@/components/profile/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function StaffDetail({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  if (!schoolId) return notFound()

  // Try to find as teacher first
  let staff = await (db as any).teacher?.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      givenName: true,
      surname: true,
      gender: true,
      emailAddress: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // If not found as teacher, try to find as other staff (you might need to adjust this based on your actual staff model)
  if (!staff) {
    // For now, we'll use a placeholder staff object
    // You can extend this to query other staff models as needed
    staff = {
      id,
      givenName: "Staff",
      surname: "Member",
      gender: "Unknown",
      emailAddress: "staff@school.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  if (!staff) return notFound()

  return (
    <ProfileContent
      role="staff"
      data={staff}
      dictionary={dictionary}
      lang={lang}
    />
  )
}

export const metadata = { title: "Dashboard: Staff" }
