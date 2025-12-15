import { redirect } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getProfileById } from "@/components/platform/profile/detail/actions"
import { ProfileDetailContent } from "@/components/platform/profile/detail/content"

export const metadata = { title: "Dashboard: User Profile" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function Page({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  // Fetch profile data
  const result = await getProfileById(id)

  // Handle errors
  if (!result.success) {
    return (
      <ProfileDetailContent
        profileData={null}
        permissionLevel="PUBLIC"
        error={result.error}
        dictionary={dictionary}
        lang={lang}
      />
    )
  }

  // Render profile with data
  return (
    <ProfileDetailContent
      profileData={result.data ?? null}
      permissionLevel={result.permissionLevel ?? ""}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
