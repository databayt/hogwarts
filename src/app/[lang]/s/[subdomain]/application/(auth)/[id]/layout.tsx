"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useState } from "react"
import { useParams, usePathname } from "next/navigation"

import type { NameFormat } from "@/lib/name-utils"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { ADMISSION_CONFIG, FormFooter } from "@/components/form/footer"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import {
  ApplySessionProvider,
  useApplySession,
} from "@/components/school-marketing/application/application-context"
import ErrorBoundary from "@/components/school-marketing/application/error-boundary"
import {
  getApplyErrorDict,
  getApplyRootDict,
} from "@/components/school-marketing/application/utils"
import {
  ApplyValidationProvider,
  useApplyValidation,
} from "@/components/school-marketing/application/validation-context"

interface ApplyLayoutProps {
  children: React.ReactNode
}

// Routes that are reached AFTER the wizard submits — render full-width clean
// content with no progress footer. The wizard chrome only belongs on the
// actual step pages.
const STANDALONE_SEGMENTS = /\/(payment|success|offer)(\/|$)/

function ApplyLayoutContent({ children }: ApplyLayoutProps) {
  const params = useParams()
  const pathname = usePathname() ?? ""
  const isStandalone = STANDALONE_SEGMENTS.test(pathname)
  const { initSession, session, saveSession } = useApplySession()
  const { isLoading, error, lastSaved, isSaving } = session
  const { dictionary } = useDictionary()
  const { locale } = useLocale()
  const id = params.id as string
  const subdomain = params.subdomain as string
  const isRTL = locale === "ar"

  const applyRoot = getApplyRootDict(dictionary)
  const errorDict = getApplyErrorDict(dictionary)
  const dict = (applyRoot?.footer as Record<string, string> | undefined) ?? {}

  useEffect(() => {
    // Skip wizard-session init on post-submit standalone routes (payment,
    // success, offer) — those pages read state from URL tokens, not the
    // applicant's in-progress form session.
    if (isStandalone) return
    if (id && subdomain && !session.sessionToken) {
      initSession(id, subdomain)
    }
  }, [id, subdomain, initSession, session.sessionToken, isStandalone])

  // Post-submit standalone pages: no container, no footer, no skeleton.
  if (isStandalone) {
    return <>{children}</>
  }

  // Render skeleton based on loading state
  const renderSkeleton = () => (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )

  // Show loading state while initializing session
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl self-stretch pb-20">
        {renderSkeleton()}
        <FormFooter
          config={ADMISSION_CONFIG}
          basePath="/application"
          dictionary={dict as Record<string, unknown>}
          locale={locale}
          useValidation={useApplyValidation}
          nextDisabled={true}
        />
      </div>
    )
  }

  // Show error state only if initialization failed (no session data yet)
  // Auto-save errors should not block the UI when form data exists
  if (
    error &&
    !session.sessionToken &&
    Object.keys(session.formData).length === 0
  ) {
    return (
      <div className="mx-auto w-full max-w-5xl self-stretch pb-20">
        <div className="flex items-center justify-center py-16">
          <div className="max-w-md text-center">
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="mb-2 text-2xl font-bold">
              {errorDict.unableToLoad}
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => id && subdomain && initSession(id, subdomain)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 transition-colors"
              >
                {errorDict.tryAgain}
              </button>
              <button
                onClick={() =>
                  (window.location.href = `/${locale}/application`)
                }
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2 transition-colors"
              >
                {errorDict.backToCampaigns}
              </button>
            </div>
          </div>
        </div>
        <FormFooter
          config={ADMISSION_CONFIG}
          basePath="/application"
          dictionary={dict as Record<string, unknown>}
          locale={locale}
          useValidation={useApplyValidation}
          nextDisabled={true}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-20">
      {children}
      <FormFooter
        config={ADMISSION_CONFIG}
        basePath="/application"
        dictionary={dict as Record<string, unknown>}
        locale={locale}
        useValidation={useApplyValidation}
        showSaveStatus={false}
        showSave={true}
        onSave={async () => {
          await saveSession()
          window.location.href = `/${locale}/application`
        }}
        finalLabel={(applyRoot?.submit as string) || dict.submit}
      />
    </div>
  )
}

export default function ApplyLayout({ children }: ApplyLayoutProps) {
  const params = useParams()
  const subdomain = params.subdomain as string
  const id = params.id as string
  const [nameFormat, setNameFormat] = useState<NameFormat>("full")

  useEffect(() => {
    if (subdomain) {
      getSchoolBySubdomain(subdomain).then((result) => {
        if (result.success && result.data?.nameFormat) {
          setNameFormat(result.data.nameFormat as NameFormat)
        }
      })
    }
  }, [subdomain])

  return (
    <ErrorBoundary>
      <ApplySessionProvider
        initialSubdomain={subdomain}
        initialCampaignId={id}
        nameFormat={nameFormat}
      >
        <ApplyValidationProvider>
          <ApplyLayoutContent>{children}</ApplyLayoutContent>
        </ApplyValidationProvider>
      </ApplySessionProvider>
    </ErrorBoundary>
  )
}
