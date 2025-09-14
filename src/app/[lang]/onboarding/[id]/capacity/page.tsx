import CapacityContent from "@/components/onboarding/capacity/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "School Capacity",
};

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Capacity({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <CapacityContent dictionary={dictionary.school} />;
}