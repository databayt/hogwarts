import { Metadata } from "next"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { StreamHomeContent } from "@/components/stream/home/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.stream?.title || "Stream - Learning Management",
    description:
      dictionary.stream?.description ||
      "Elevate your learning experience with our LMS platform",
  }
}

export default async function StreamHomePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()

  const isAdmin =
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "TEACHER" ||
    session?.user?.role === "DEVELOPER"

  return (
    <StreamHomeContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      isAuthenticated={!!session?.user}
      isAdmin={isAdmin}
    />
  )
}
