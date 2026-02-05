import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { SidebarProvider } from "@/components/ui/sidebar"
import { ModalProvider } from "@/components/atom/modal/context"
import {
  isRTL as checkIsRTL,
  type Locale,
} from "@/components/internationalization/config"
import { PageHeadingProvider } from "@/components/school-dashboard/context/page-heading-context"
import { PageHeadingDisplay } from "@/components/school-dashboard/context/page-heading-display"
import SaasHeader from "@/components/template/saas-header/content"
import SaasSidebar from "@/components/template/saas-sidebar/content"

// All saas-dashboard pages are dynamic - they require auth and query the database
export const dynamic = "force-dynamic"

interface OperatorLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function OperatorLayout({
  children,
  params,
}: Readonly<OperatorLayoutProps>) {
  const { lang } = await params

  // SERVER-SIDE AUTH CHECK - CRITICAL SECURITY
  // Only DEVELOPER role can access the SaaS dashboard
  // This check MUST happen before any rendering to prevent unauthorized access
  const session = await auth()

  if (!session) {
    // Not logged in - redirect to login
    redirect(`/${lang}/login?callbackUrl=/${lang}/dashboard`)
  }

  if (session.user?.role !== "DEVELOPER") {
    // Logged in but not DEVELOPER - redirect to onboarding
    // This is a security-critical redirect - non-DEVELOPER users cannot access SaaS dashboard
    redirect(`/${lang}/onboarding`)
  }

  // Only DEVELOPER role reaches this point
  const isRTL = checkIsRTL(lang as Locale)

  // DEVELOPER role - allow access
  return (
    <SidebarProvider>
      <ModalProvider>
        <PageHeadingProvider>
          <div
            className="flex min-h-svh w-full flex-col"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <SaasHeader />
            <div className="flex pt-6">
              <SaasSidebar />
              <div className="dashboard-container pb-10 transition-[margin] duration-200 ease-in-out">
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
  )
}
