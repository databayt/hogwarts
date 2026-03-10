// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
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
import { ForceChangePasswordModal } from "@/components/school-dashboard/force-change-password-modal"
import PlatformHeader from "@/components/template/platform-header/content"
import PlatformSidebar from "@/components/template/platform-sidebar/content"

// All school-dashboard pages are dynamic - they require auth, subdomain lookup, and query the database
export const dynamic = "force-dynamic"

interface PlatformLayoutProps {
  children: React.ReactNode
  params: Promise<{ subdomain: string; lang: string }>
}

/**
 * IMPORTANT: Auth checks use redirect() which throws a NEXT_REDIRECT error.
 * In Next.js 16 streaming SSR, pages can start rendering in parallel with
 * the layout. If the layout's redirect() fires after the page content has
 * already been streamed, the RSC payload contains both content AND a redirect
 * error, crashing the client with React Error #310 ("Rendered fewer hooks
 * than expected"). To prevent this, unauthenticated users are caught by
 * middleware (fast path), and the membership mismatch check returns an
 * inline access-denied UI instead of calling redirect().
 */
export default async function PlatformLayout({
  children,
  params,
}: Readonly<PlatformLayoutProps>) {
  const { subdomain, lang } = await params
  const [result, session] = await Promise.all([
    getSchoolBySubdomain(subdomain),
    auth(),
  ])

  if (!result.success) {
    if (result.errorType === "db_error") {
      throw new Error("Database temporarily unavailable")
    }
    notFound()
  }

  const school = result.data

  // MEMBERSHIP GUARD — only school members and DEVELOPERs can access dashboard
  // Unauthenticated: redirect to login (middleware should catch this first,
  // but this is a safety net). redirect() is safe here because no children
  // content will stream for unauthenticated requests.
  if (!session?.user) {
    redirect(`/${lang}/login`)
  }

  // Membership mismatch: return inline access-denied UI instead of redirect()
  // to avoid the streaming RSC conflict described above.
  if (
    session.user.role !== "DEVELOPER" &&
    session.user.schoolId !== school.id
  ) {
    return (
      <div
        style={{
          fontFamily:
            'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          height: "100vh",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 16 }}>
          Access Denied
        </h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
          You don&apos;t have permission to access this school&apos;s dashboard.
        </p>
        <a
          href={`/${lang}`}
          style={{
            color: "#3b82f6",
            textDecoration: "underline",
          }}
        >
          Go to homepage
        </a>
      </div>
    )
  }

  const serverRole = session.user.role
  const isRTL = checkIsRTL(lang as Locale)

  // Check if user must change their password (e.g., admin-forced reset)
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true, password: true },
  })
  const mustChangePassword = currentUser?.mustChangePassword ?? false

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
                  <PageHeadingDisplay />
                  {children}
                </div>
              </div>
              {mustChangePassword && (
                <ForceChangePasswordModal
                  hasPassword={!!currentUser?.password}
                />
              )}
            </div>
          </PageHeadingProvider>
        </ModalProvider>
      </SidebarProvider>
    </SchoolProvider>
  )
}
