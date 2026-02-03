import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import BlogContent from "@/components/saas-marketing/blog/content"

export const metadata = {
  title: "Blog",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Blog({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <BlogContent dictionary={dictionary} lang={lang} />
}
