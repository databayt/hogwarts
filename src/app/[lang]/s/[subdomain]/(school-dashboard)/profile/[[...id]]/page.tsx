import { Metadata } from "next"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ProfileDetailContent } from "@/components/school-dashboard/profile/detail/content"
import { getProfileView } from "@/components/school-dashboard/profile/queries"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id?: string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary.school.profile?.title || "Profile",
  }
}

export default async function Page({ params }: Props) {
  const { lang, id } = await params
  const [dictionary, session] = await Promise.all([getDictionary(lang), auth()])

  const targetId = id?.[0] || session?.user?.id
  if (!targetId) {
    return (
      <ProfileDetailContent
        profileData={null}
        errorCode="NOT_AUTHENTICATED"
        dictionary={dictionary}
        lang={lang}
      />
    )
  }

  const result = await getProfileView(targetId, lang)

  if (!result.success) {
    return (
      <ProfileDetailContent
        profileData={null}
        errorCode={result.errorCode}
        dictionary={dictionary}
        lang={lang}
      />
    )
  }

  return (
    <ProfileDetailContent
      profileData={result.data}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
