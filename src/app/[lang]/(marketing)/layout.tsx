import MarketingHeader from "@/components/template/marketing-header/content";
import { MarketingFooter } from "@/components/template/marketing-footer/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface MarketingLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>
}

export default async function MarketingLayout({
  children,
  params
}: MarketingLayoutProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang as Locale);

  return (
    <div data-slot="site-layout">
      <MarketingHeader dictionary={dictionary} />
      <main
        data-slot="main-content"
        role="main"
      >
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}