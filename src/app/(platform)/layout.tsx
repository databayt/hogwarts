import { SidebarProvider } from "@/components/ui/sidebar";
import PlatformHeader from "@/components/template/platform-header/content";
import PlatformSidebar from "@/components/template/platform-sidebar/content";



export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* Ensure the provider's flex wrapper has a single column child to preserve layout */}
      <div className="flex min-h-svh w-full flex-col">
        <PlatformHeader />
        <div className="flex pt-6">
          <PlatformSidebar />
          <div className="w-full">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}