import BlogContent from "@/components/marketing/blog/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Blog",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Blog({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <BlogContent dictionary={dictionary} lang={lang} />;
}