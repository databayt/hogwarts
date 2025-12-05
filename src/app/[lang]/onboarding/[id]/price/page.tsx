import { HostStepLayout } from '@/components/onboarding';
import PriceContent from '@/components/onboarding/price/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Price | Onboarding",
  description: "Set your school's pricing.",
};

interface Props {
  params: Promise<{ lang: Locale; id: string }>;
}

export default async function Price({ params }: Props) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);
  const dict = (dictionary as any)?.school?.onboarding || {};

  return (
    <HostStepLayout
      title={
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl font-bold">
            {dict.pricePageTitle || "Set your school's"}
            <br />
            {dict.pricePageTitleBreak || "tuition fees"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {dict.pricePageDescription || "This will be the annual tuition fee for your school. You can change this later in your school settings."}
          </p>
        </div>
      }
    >
      <PriceContent dictionary={dictionary} lang={lang} id={id} />
    </HostStepLayout>
  );
} 