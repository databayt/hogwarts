import MarketingHeader from "@/components/template/marketing-header/content";
import { MarketingFooter } from "@/components/template/marketing-footer/content";
// import { SiteFooter } from "@/components/site-footer";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-slot="site-layout">
      <MarketingHeader />
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