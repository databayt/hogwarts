import { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import LibraryBookDetailContent from "@/components/library/book-detail/content"

interface Props {
  params: Promise<{ id: string; subdomain: string; lang: Locale }>
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.school.library.bookDetails || "Book Details",
    description:
      dictionary.school.library.description || "View book details and borrow",
  }
}

export default async function LibraryBookDetail({ params }: Props) {
  const { id, lang } = await params
  const [session, dictionary] = await Promise.all([auth(), getDictionary(lang)])

  if (!session?.user?.id) {
    notFound()
  }

  return (
    <LibraryBookDetailContent
      bookId={id}
      userId={session.user.id}
      dictionary={dictionary.school}
    />
  )
}
