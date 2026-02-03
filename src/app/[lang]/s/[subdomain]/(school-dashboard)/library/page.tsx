import { Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import LibraryContent from "@/components/library/content"

interface Props {
  params: Promise<{ subdomain: string; lang: Locale }>
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.school.library.title || "Library",
    description:
      dictionary.school.library.description ||
      "Browse and borrow books from the school library",
  }
}

export default async function Library({ params }: Props) {
  const { lang } = await params
  // Parallelize independent async operations to avoid request waterfalls
  const [session, dictionary] = await Promise.all([auth(), getDictionary(lang)])

  return (
    <LibraryContent
      userId={session?.user?.id as string}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
