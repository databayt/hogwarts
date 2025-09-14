import { HostStepLayout } from '@/components/onboarding';
import PriceContent from '@/components/onboarding/price/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Price | Onboarding",
  description: "Set your school's pricing.",
};

interface PageProps {
  params: Promise<{ lang: Locale; id: string }>
}

export default async function PricePage({ params }: PageProps) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <HostStepLayout title=" " subtitle=" ">
      <PriceContent dictionary={dictionary.school} />
    </HostStepLayout>
  );
} 