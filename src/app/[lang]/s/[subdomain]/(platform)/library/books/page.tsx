import { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AllBooksContent from "@/components/library/book-list/all-books-content"

interface Props {
  params: Promise<{ subdomain: string; lang: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.library?.filters?.all || "All Books",
    description:
      dictionary.school?.library?.description ||
      "Browse all books in the school library",
  }
}

export default async function LibraryAllBooks() {
  return <AllBooksContent />
}
