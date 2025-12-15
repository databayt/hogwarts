import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { StreamDashboardContent } from "@/components/stream/dashboard/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.stream?.dashboard?.title || "My Learning Dashboard",
    description:
      dictionary.stream?.dashboard?.description ||
      "Track your learning progress",
  }
}

export default async function StreamDashboardPage({ params }: Props) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()

  if (!session?.user) {
    redirect(`/${lang}/s/${subdomain}/auth/login`)
  }

  return (
    <StreamDashboardContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      userId={session.user.id}
    />
  )
}
