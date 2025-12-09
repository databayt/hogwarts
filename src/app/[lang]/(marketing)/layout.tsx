import { SiteHeader } from "@/components/template/marketing-header/site-header";
import { SiteFooter } from "@/components/template/marketing-header/site-footer";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { Chatbot } from "@/components/chatbot";

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
    <div className="marketing-container min-h-screen flex flex-col">
      <SiteHeader dictionary={dictionary} locale={lang} />
      <main className="flex-1">
        {children}
      </main>
      <SiteFooter dictionary={dictionary} />
      <Chatbot lang={lang as Locale} promptType="saasMarketing" />
    </div>
  );
}