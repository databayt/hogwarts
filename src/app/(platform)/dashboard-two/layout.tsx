import type { Metadata } from "next";
import AppSidebar from "@/components/template/dashboard-sidebar/content";
import Navbar from "@/components/platform/dashboard-two/navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard layout",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  
  return (
    <div className="flex">
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <main className="w-full">
          <Navbar />
          <div className="px-4">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
}
