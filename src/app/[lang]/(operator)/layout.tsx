import { SidebarProvider } from "@/components/ui/sidebar";
import { ModalProvider } from "@/components/atom/modal/context";
import SaasHeader from "@/components/template/saas-header/content";
import SaasSidebar from "@/components/template/saas-sidebar/content";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PlatformLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  // Auth protection (moved from middleware to avoid Edge Function size limits)
  const session = await auth();
  if (!session?.user) {
    const { lang } = await params;
    redirect(`/${lang}/login?callbackUrl=${encodeURIComponent(`/${lang}/dashboard`)}`);
  }
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