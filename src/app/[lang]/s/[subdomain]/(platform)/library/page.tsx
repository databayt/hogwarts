import { Metadata } from "next";
import LibraryContent from "@/components/library/content";
import { auth } from "@/auth";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ subdomain: string; lang: Locale }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.school.library.title || "Library",
    description: dictionary.school.library.description || "Browse and borrow books from the school library",
  };
}

export default async function Library({ params }: Props) {
  const { lang } = await params;
  const session = await auth();

  return <LibraryContent userId={session?.user?.id as string} />;
}
