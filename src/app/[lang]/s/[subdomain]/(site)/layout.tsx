import SiteHeader from "@/components/template/site-header/content";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { notFound } from "next/navigation";

// import { SiteFooter } from "@/components/site-footer";

interface SiteLayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string; lang: string }>;
}

export default async function SiteLayout({
  children,
  params,
}: Readonly<SiteLayoutProps>) {
  const { subdomain, lang } = await params;
  const result = await getSchoolBySubdomain(subdomain);

  if (!result.success || !result.data) {
    notFound();
  }

  const school = result.data;

  return (
    <div data-slot="site-layout">
      <SiteHeader school={school} locale={lang} />
      <main 
        data-slot="main-content"
        role="main"
      >
        {children}
      </main>
      {/* <SiteFooter /> */}
    </div>
  );
}