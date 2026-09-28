// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { ModalProvider } from "@/components/atom/modal/context"
import {
  isRTL as checkIsRTL,
  type Locale,
} from "@/components/internationalization/config"
import {
  getMessagingDictionary,
  type Dictionary,
} from "@/components/internationalization/dictionaries"
import { DictionaryProvider } from "@/components/internationalization/dictionary-context"
import { SchoolProvider } from "@/components/school-dashboard/context/school-context"
import { MustChangePasswordGate } from "@/components/school-dashboard/must-change-password-gate"
import { getText } from "@/components/translation/display"
import { detectLang } from "@/components/translation/util"

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
  const [result, session, dictionary] = await Promise.all([
    getSchoolBySubdomain(subdomain),
    auth(),
    // Route-scoped: this subtree only renders messaging UI (consumes the
    // `messaging` namespace + core general/school). getMessagingDictionary
    // covers core + messages + messaging; the omitted feature namespaces are
    // never accessed here, so the narrower payload is safe at runtime.
    getMessagingDictionary(lang as Locale),
  ])

  if (!result.success) {
    if (result.errorType === "db_error") {
      throw new Error("Database temporarily unavailable")
    }
    notFound()
  }

  // A copy — result.data is getSchoolBySubdomain's cached object, and the
  // name is rewritten below per viewer language (see the dashboard layout).
  const school = { ...result.data }

  // Translate school name for display when viewing in a different language
  if (lang === "en" && school.nameEn) {
    school.name = school.nameEn
  } else if (detectLang(school.name) !== lang && school.id) {
    school.name = await getText(
      school.name,
      detectLang(school.name) as "ar" | "en",
      lang as "ar" | "en",
      school.id
    )
  }

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

  return (
    <DictionaryProvider dictionary={dictionary as Dictionary}>
      <SchoolProvider school={school}>
        <ModalProvider>
          <div
            className="font-ios-system h-dvh overflow-hidden"
            style={{
              marginInlineStart: "calc(-1 * var(--container-px))",
              marginInlineEnd: "calc(-1 * var(--container-px))",
              width: "calc(100% + 2 * var(--container-px))",
            }}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {children}
          </div>
          <Suspense fallback={null}>
            <MustChangePasswordGate userId={session.user.id} />
          </Suspense>
        </ModalProvider>
      </SchoolProvider>
    </DictionaryProvider>
  )
}
