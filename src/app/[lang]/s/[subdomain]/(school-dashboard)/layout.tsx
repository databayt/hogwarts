import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ModalProvider } from "@/components/atom/modal/context"
import {
  isRTL as checkIsRTL,
  type Locale,
} from "@/components/internationalization/config"
import { PageHeadingProvider } from "@/components/school-dashboard/context/page-heading-context"
import { PageHeadingDisplay } from "@/components/school-dashboard/context/page-heading-display"
import { SchoolProvider } from "@/components/school-dashboard/context/school-context"
import PlatformHeader from "@/components/template/platform-header/content"
import PlatformSidebar from "@/components/template/platform-sidebar/content"

// All school-dashboard pages are dynamic - they require auth, subdomain lookup, and query the database
export const dynamic = "force-dynamic"

interface PlatformLayoutProps {
  children: React.ReactNode
  params: Promise<{ subdomain: string; lang: string }>
}

export default async function PlatformLayout({
  children,
  params,
}: Readonly<PlatformLayoutProps>) {
  const { subdomain, lang } = await params
  const [result, session] = await Promise.all([
    getSchoolBySubdomain(subdomain),
    auth(),
  ])

  if (!result.success || !result.data) {
    console.error("School not found for subdomain:", subdomain, result)
    notFound()
  }

  const school = result.data
  const serverRole = session?.user?.role
  const isRTL = checkIsRTL(lang as Locale)

  return (
    <SchoolProvider school={school}>
      <SidebarProvider>
        <ModalProvider>
          <PageHeadingProvider>
            {/* Ensure the provider's flex wrapper has a single column child to preserve layout */}
            <div
              className="flex min-h-svh w-full flex-col"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <PlatformHeader
                school={school}
                lang={lang}
                serverRole={serverRole}
              />
              <div className="flex pt-6">
                <PlatformSidebar
                  school={school}
                  lang={lang}
                  serverRole={serverRole}
                />
                <div className="dashboard-container overflow-x-clip pb-10 transition-[margin] duration-200 ease-in-out">
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
    </SchoolProvider>
  )
}
