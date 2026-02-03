import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { safeQuery } from "@/lib/prisma-guards"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ProfileContent from "@/components/profile/content"
import { getTenantContext } from "@/components/saas-dashboard/lib/tenant"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function StaffDetail({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  if (!schoolId) return notFound()

  // Get current session to determine ownership
  const session = await auth()

  // Try to find as teacher first
  let staff = await safeQuery("teacher", (model) =>
    model.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        givenName: true,
        surname: true,
        gender: true,
        emailAddress: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    })
  )

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
      userId: null,
    }
  }

  if (!staff) return notFound()

  // Check if current user is the owner of this profile
  const isOwner = session?.user?.id === staff.userId

  return (
    <ProfileContent
      role="staff"
      data={staff}
      dictionary={dictionary}
      lang={lang}
      isOwner={isOwner}
      userId={staff.userId || undefined}
    />
  )
}

export const metadata = { title: "Dashboard: Staff" }
