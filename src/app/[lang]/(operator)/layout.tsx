import { SidebarProvider } from "@/components/ui/sidebar";
import { ModalProvider } from "@/components/atom/modal/context";
import { PageHeadingProvider } from "@/components/platform/context/page-heading-context";
import { PageHeadingDisplay } from "@/components/platform/context/page-heading-display";
import SaasHeader from "@/components/template/saas-header/content";
import SaasSidebar from "@/components/template/saas-sidebar/content";
import { isRTL as checkIsRTL, type Locale } from "@/components/internationalization/config";

interface OperatorLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function OperatorLayout({
  children,
  params,
}: Readonly<OperatorLayoutProps>) {
  const { lang } = await params;
  const isRTL = checkIsRTL(lang as Locale);

  return (
    <SidebarProvider>
      <ModalProvider>
        <PageHeadingProvider>
          <div className="flex min-h-svh w-full flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
            <SaasHeader />
            <div className="flex pt-6">
              <SaasSidebar />
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
  );
}