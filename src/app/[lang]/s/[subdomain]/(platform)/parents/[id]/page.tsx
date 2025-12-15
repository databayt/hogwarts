import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getTenantContext } from "@/components/operator/lib/tenant"
import ProfileContent from "@/components/profile/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ParentDetail({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  if (!schoolId || !(db as any).guardian) return notFound()

  const parent = await (db as any).guardian.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      givenName: true,
      surname: true,
      emailAddress: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!parent) return notFound()

  return (
    <ProfileContent
      role="parent"
      data={parent}
      dictionary={dictionary}
      lang={lang}
    />
  )
}

export const metadata = { title: "Dashboard: Parent" }
