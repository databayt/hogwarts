import { SidebarProvider } from "@/components/ui/sidebar";
import { ModalProvider } from "@/components/atom/modal/context";
import { PageHeadingProvider } from "@/components/platform/context/page-heading-context";
import { PageHeadingDisplay } from "@/components/platform/context/page-heading-display";
import SaasHeader from "@/components/template/saas-header/content";
import SaasSidebar from "@/components/template/saas-sidebar/content";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ModalProvider>
        <PageHeadingProvider>
          <div className="flex min-h-svh w-full flex-col">
            <SaasHeader />
            <div className="flex pt-6">
              <SaasSidebar />
              <div className="w-full pb-10">
                <div className="mb-6 px-4 sm:px-6 lg:px-8">
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