import AppSidebar from '@/components/template/dashboard-sidebar/content';
import DashboardHeader from '@/components/template/dashboard-header/content';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
// import { auth } from '@/auth';
// import { redirect } from 'next/navigation';
// import { getTenantContext } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Next Shadcn Dashboard Starter',
  description: 'Basic dashboard with Next.js and Shadcn'
};

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Require authenticated DEVELOPER role for operator layout — temporarily disabled for public demo
  // const session = await auth();
  // if (!session) redirect('/login');
  // const { isPlatformAdmin } = await getTenantContext();
  // if (!isPlatformAdmin) redirect('/403');
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = cookieVal === undefined ? true : cookieVal === "true";
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
