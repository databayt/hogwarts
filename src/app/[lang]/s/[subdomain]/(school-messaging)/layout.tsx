// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { ModalProvider } from "@/components/atom/modal/context"
import {
  isRTL as checkIsRTL,
  type Locale,
} from "@/components/internationalization/config"
import { SchoolProvider } from "@/components/school-dashboard/context/school-context"
import { ForceChangePasswordModal } from "@/components/school-dashboard/force-change-password-modal"
import { db } from "@/lib/db"

// All school-messaging pages are dynamic - they require auth, subdomain lookup, and query the database
export const dynamic = "force-dynamic"

interface MessagingLayoutProps {
  children: React.ReactNode
  params: Promise<{ subdomain: string; lang: string }>
}

/**
 * Standalone full-screen messaging layout.
 * No header, no sidebar, no footer — the messaging UI owns the entire viewport.
 * Auth guards and SchoolProvider are preserved from the dashboard layout.
 */
export default async function MessagingLayout({
  children,
  params,
}: Readonly<MessagingLayoutProps>) {
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

  if (!session?.user) {
    redirect(`/${lang}/login`)
  }

  if (
    session.user.role !== "DEVELOPER" &&
    session.user.schoolId !== school.id
  ) {
    const isAr = lang === "ar"
    return (
      <div
        dir={isAr ? "rtl" : "ltr"}
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
          {isAr ? "تم رفض الوصول" : "Access Denied"}
        </h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
          {isAr
            ? "ليس لديك صلاحية للوصول إلى لوحة تحكم هذه المدرسة."
            : "You don't have permission to access this school's dashboard."}
        </p>
        <a
          href={`/${lang}`}
          style={{
            color: "#3b82f6",
            textDecoration: "underline",
          }}
        >
          {isAr ? "الذهاب إلى الصفحة الرئيسية" : "Go to homepage"}
        </a>
      </div>
    )
  }

  const isRTL = checkIsRTL(lang as Locale)

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true, password: true },
  })
  const mustChangePassword = currentUser?.mustChangePassword ?? false

  return (
    <SchoolProvider school={school}>
      <ModalProvider>
        <div
          className="h-screen w-full overflow-hidden"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {children}
        </div>
        {mustChangePassword && (
          <ForceChangePasswordModal
            hasPassword={!!currentUser?.password}
          />
        )}
      </ModalProvider>
    </SchoolProvider>
  )
}
