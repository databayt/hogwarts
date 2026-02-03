"use client"

import React, { useEffect } from "react"
import { useParams } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { ADMISSION_CONFIG, FormFooter } from "@/components/form/footer"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import {
  ApplySessionProvider,
  useApplySession,
} from "@/components/school-marketing/apply/application-context"
import ErrorBoundary from "@/components/school-marketing/apply/error-boundary"
import {
  ApplyValidationProvider,
  useApplyValidation,
} from "@/components/school-marketing/apply/validation-context"

interface ApplyLayoutProps {
  children: React.ReactNode
}

function ApplyLayoutContent({ children }: ApplyLayoutProps) {
  const params = useParams()
  const { initSession, session, saveSession } = useApplySession()
  const { isLoading, error, lastSaved, isSaving } = session
  const { dictionary } = useDictionary()
  const { locale } = useLocale()
  const id = params.id as string
  const subdomain = params.subdomain as string
  const isRTL = locale === "ar"

  const dict =
    ((dictionary as Record<string, unknown> | null)?.apply as
      | Record<string, string>
      | undefined) ?? {}

  useEffect(() => {
    if (id && subdomain && !session.sessionToken) {
      initSession(subdomain, id)
    }
  }, [id, subdomain, initSession, session.sessionToken])

  // Render skeleton based on loading state
  const renderSkeleton = () => (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
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
      <div className="mx-auto w-full max-w-5xl pb-20">
        {renderSkeleton()}
        <FormFooter
          config={ADMISSION_CONFIG}
          basePath={`/${locale}/s/${subdomain}/apply`}
          dictionary={dict as Record<string, unknown>}
          locale={locale}
          useValidation={useApplyValidation}
          nextDisabled={true}
        />
      </div>
    )
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl pb-20">
        <div className="flex items-center justify-center py-16">
          <div className="max-w-md text-center">
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="mb-2 text-2xl font-bold">
              {dict.unableToLoad ||
                (isRTL ? "تعذر تحميل الطلب" : "Unable to Load Application")}
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => id && subdomain && initSession(subdomain, id)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 transition-colors"
              >
                {dict.tryAgain || (isRTL ? "حاول مرة أخرى" : "Try Again")}
              </button>
              <button
                onClick={() =>
                  (window.location.href = `/${locale}/s/${subdomain}/apply`)
                }
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2 transition-colors"
              >
                {dict.backToCampaigns ||
                  (isRTL ? "العودة للحملات" : "Back to Campaigns")}
              </button>
            </div>
          </div>
        </div>
        <FormFooter
          config={ADMISSION_CONFIG}
          basePath={`/${locale}/s/${subdomain}/apply`}
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
        basePath={`/${locale}/s/${subdomain}/apply`}
        dictionary={dict as Record<string, unknown>}
        locale={locale}
        useValidation={useApplyValidation}
        showSaveStatus={true}
        lastSaved={lastSaved}
        isSaving={isSaving}
        onSave={saveSession}
        finalLabel={isRTL ? "تقديم الطلب" : "Submit Application"}
        finalDestination={`/${locale}/s/${subdomain}/apply/${id}/success`}
      />
    </div>
  )
}

export default function ApplyLayout({ children }: ApplyLayoutProps) {
  return (
    <ErrorBoundary>
      <ApplySessionProvider>
        <ApplyValidationProvider>
          <ApplyLayoutContent>{children}</ApplyLayoutContent>
        </ApplyValidationProvider>
      </ApplySessionProvider>
    </ErrorBoundary>
  )
}
