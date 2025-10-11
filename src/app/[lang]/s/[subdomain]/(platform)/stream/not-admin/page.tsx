import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { StreamNotAdminContent } from "@/components/stream/not-admin/content";
import { Metadata } from "next";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.stream?.notAdmin?.title || "Access Restricted",
    description: dictionary.stream?.notAdmin?.description || "You do not have permission to access this area",
  };
}

export default async function StreamNotAdminPage({ params }: Props) {
  const { lang, subdomain } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <StreamNotAdminContent
      dictionary={dictionary.stream}
      lang={lang}
      subdomain={subdomain}
    />
  );
}