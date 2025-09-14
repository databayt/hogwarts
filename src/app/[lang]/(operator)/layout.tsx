import { SidebarProvider } from "@/components/ui/sidebar";
import { ModalProvider } from "@/components/atom/modal/context";
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
        <div className="flex min-h-svh w-full flex-col">
          <SaasHeader />
          <div className="flex pt-6">
            <SaasSidebar />
            <div className="w-full pb-10">{children}</div>
          </div>
        </div>
      </ModalProvider>
    </SidebarProvider>
  );
}