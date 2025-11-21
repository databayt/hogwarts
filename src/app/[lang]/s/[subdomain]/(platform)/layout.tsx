import { SidebarProvider } from "@/components/ui/sidebar";
import { ModalProvider } from "@/components/atom/modal/context";
import PlatformHeader from "@/components/template/platform-header/content";
import PlatformSidebar from "@/components/template/platform-sidebar/content";
import { SchoolProvider } from "@/components/platform/context/school-context";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { notFound, redirect } from "next/navigation";
import { isRTL as checkIsRTL, type Locale } from "@/components/internationalization/config";
import { auth } from "@/auth";

interface PlatformLayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string; lang: string }>;
}

export default async function PlatformLayout({
  children,
  params,
}: Readonly<PlatformLayoutProps>) {
  const { subdomain, lang } = await params;

  // Auth protection (moved from middleware to avoid Edge Function size limits)
  const session = await auth();
  if (!session?.user) {
    // Preserve current URL for callback after login
    const callbackUrl = encodeURIComponent(`/${lang}/s/${subdomain}/dashboard`);
    redirect(`/${lang}/login?callbackUrl=${callbackUrl}`);
  }

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
          {/* Ensure the provider's flex wrapper has a single column child to preserve layout */}
          <div className="flex min-h-svh w-full flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
            <PlatformHeader school={school} lang={lang} />
            <div className="flex pt-6">
              <PlatformSidebar school={school} lang={lang} side={isRTL ? 'right' : 'left'} />
              <div className="w-full pb-10 transition-[margin] duration-200 ease-in-out">{children}</div>
            </div>
          </div>
        </ModalProvider>
      </SidebarProvider>
    </SchoolProvider>
  );
}