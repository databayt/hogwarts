import { SidebarProvider } from "@/components/ui/sidebar";
import { ModalProvider } from "@/components/atom/modal/context";
import PlatformHeader from "@/components/template/platform-header/content";
import PlatformSidebar from "@/components/template/platform-sidebar/content";
import { SchoolProvider } from "@/components/platform/context/school-context";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { notFound } from "next/navigation";

interface PlatformLayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}

export default async function PlatformLayout({
  children,
  params,
}: Readonly<PlatformLayoutProps>) {
  const { subdomain } = await params;
  const result = await getSchoolBySubdomain(subdomain);

  if (!result.success || !result.data) {
    console.error('School not found for subdomain:', subdomain, result);
    notFound();
  }

  const school = result.data;
  
  // Debug logging
  console.log('Platform layout - school data:', { subdomain, school });

  return (
    <SchoolProvider school={school}>
      <SidebarProvider>
        <ModalProvider>
          {/* Ensure the provider's flex wrapper has a single column child to preserve layout */}
          <div className="flex min-h-svh w-full flex-col">
            <PlatformHeader school={school} />
            <div className="flex pt-6">
              <PlatformSidebar school={school} />
              <div className="w-full pb-10">{children}</div>
            </div>
          </div>
        </ModalProvider>
      </SidebarProvider>
    </SchoolProvider>
  );
}