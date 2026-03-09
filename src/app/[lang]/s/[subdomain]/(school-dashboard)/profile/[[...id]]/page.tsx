import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getProfileBasicData } from "@/components/school-dashboard/profile/actions"
import { ProfileDetailContent } from "@/components/school-dashboard/profile/detail/content"
import type { ProfileRole } from "@/components/school-dashboard/profile/types"

export const metadata = { title: "Dashboard: Profile" }

function toProfileRole(role?: string): ProfileRole {
  switch (role) {
    case "STUDENT":
      return "student"
    case "TEACHER":
      return "teacher"
    case "GUARDIAN":
      return "parent"
    default:
      return "staff"
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id?: string[] }>
}

export default async function Page({ params }: Props) {
  const { lang, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(lang), auth()])

  const targetId = id?.[0] || session?.user?.id
  if (!targetId) {
    return (
      <ProfileDetailContent
        profileData={null}
        role="staff"
        isOwner={false}
        userId=""
        error="Not authenticated"
        dictionary={dictionary}
        lang={lang}
      />
    )
  }

  const isOwner = session?.user?.id === targetId
  const result = await getProfileBasicData(targetId, lang)

  if (!result.success) {
    return (
      <ProfileDetailContent
        profileData={null}
        role="staff"
        isOwner={false}
        userId={targetId}
        error={result.error}
        dictionary={dictionary}
        lang={lang}
      />
    )
  }

  const role = toProfileRole(result.data.role as string)

  return (
    <ProfileDetailContent
      profileData={result.data}
      role={role}
      isOwner={isOwner}
      userId={targetId}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
