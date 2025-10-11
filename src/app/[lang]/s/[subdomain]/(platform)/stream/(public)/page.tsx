import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { StreamHomeContent } from "@/components/stream/home/content";
import { Metadata } from "next";
import { getTenantContext } from "@/lib/tenant-context";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.stream?.title || "Stream - Learning Management",
    description: dictionary.stream?.description || "Elevate your learning experience with our LMS platform",
  };
}

export default async function StreamHomePage({ params }: Props) {
  const { lang, subdomain } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext(subdomain);

  return (
    <StreamHomeContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
    />
  );
}