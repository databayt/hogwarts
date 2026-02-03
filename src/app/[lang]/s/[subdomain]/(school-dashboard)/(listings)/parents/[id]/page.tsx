import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { getModel } from "@/lib/prisma-guards"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ProfileContent from "@/components/profile/content"
import { getTenantContext } from "@/components/saas-dashboard/lib/tenant"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ParentDetail({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  // Get current session to determine ownership
  const session = await auth()

  const guardianModel = getModel("guardian")
  if (!schoolId || !guardianModel) return notFound()

  const parent = await guardianModel.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      givenName: true,
      surname: true,
      emailAddress: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    },
  })

  if (!parent) return notFound()

  // Check if current user is the owner of this profile
  const isOwner = session?.user?.id === parent.userId

  return (
    <ProfileContent
      role="parent"
      data={parent}
      dictionary={dictionary}
      lang={lang}
      isOwner={isOwner}
      userId={parent.userId || undefined}
    />
  )
}

export const metadata = { title: "Dashboard: Parent" }
