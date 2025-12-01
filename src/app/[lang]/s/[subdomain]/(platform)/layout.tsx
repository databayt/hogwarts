import { SidebarProvider } from "@/components/ui/sidebar";
import { ModalProvider } from "@/components/atom/modal/context";
import PlatformHeader from "@/components/template/platform-header/content";
import PlatformSidebar from "@/components/template/platform-sidebar/content";
import { SchoolProvider } from "@/components/platform/context/school-context";
import { PageHeadingProvider } from "@/components/platform/context/page-heading-context";
import { PageHeadingDisplay } from "@/components/platform/context/page-heading-display";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { notFound } from "next/navigation";
import { isRTL as checkIsRTL, type Locale } from "@/components/internationalization/config";

interface PlatformLayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string; lang: string }>;
}

export default async function PlatformLayout({
  children,
  params,
}: Readonly<PlatformLayoutProps>) {
  const { subdomain, lang } = await params;
  const result = await getSchoolBySubdomain(subdomain);

  if (!result.success || !result.data) {
    console.error('School not found for subdomain:', subdomain, result);
    notFound();
  }

  const school = result.data;
  const isRTL = checkIsRTL(lang as Locale);

  // Debug logging
  console.log('Platform layout - school data:', { subdomain, school, lang, isRTL });

  return (
    <SchoolProvider school={school}>
      <SidebarProvider>
        <ModalProvider>
          <PageHeadingProvider>
            {/* Ensure the provider's flex wrapper has a single column child to preserve layout */}
            <div className="flex min-h-svh w-full flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
              <PlatformHeader school={school} lang={lang} />
              <div className="flex pt-6">
                <PlatformSidebar school={school} lang={lang} side={isRTL ? 'right' : 'left'} />
                <div className="w-full pb-10 transition-[margin] duration-200 ease-in-out">
                  <div className="mb-6">
                    <PageHeadingDisplay />
                  </div>
                  {children}
                </div>
              </div>
            </div>
          </PageHeadingProvider>
        </ModalProvider>
      </SidebarProvider>
    </SchoolProvider>
  );
}