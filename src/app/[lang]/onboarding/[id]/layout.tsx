"use client"

import React, { useEffect } from "react"
import { useParams } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { FormFooter, ONBOARDING_CONFIG } from "@/components/form/footer"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { ErrorBoundary } from "@/components/onboarding/error-boundary"
import {
  HostValidationProvider,
  useHostValidation,
} from "@/components/onboarding/host-validation-context"
import {
  ListingProvider,
  useListing,
} from "@/components/onboarding/use-listing"

interface HostLayoutProps {
  children: React.ReactNode
}

function HostLayoutContent({ children }: HostLayoutProps) {
  const params = useParams()
  const { loadListing, isLoading, error } = useListing()
  const { dictionary } = useDictionary()
  const { locale } = useLocale()
  const listingId = params.id as string | null
  const dict = (dictionary?.school?.onboarding || {}) as Record<
    string,
    string | undefined
  >

  useEffect(() => {
    if (listingId) {
      loadListing(listingId)
    }
  }, [listingId, loadListing])

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl pb-20">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-10 w-full" />
        </div>
        <FormFooter
          config={ONBOARDING_CONFIG}
          basePath="/onboarding"
          dictionary={dictionary?.school?.onboarding}
          locale={locale}
          useValidation={useHostValidation}
          finalLabel={dict.createSchool}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl pb-20">
        <div className="max-w-md text-center">
          <h2>{dict.unableToLoadSchool || "Unable to Load School"}</h2>
          <p className="muted mb-4">{error}</p>
          <button
            onClick={() => listingId && loadListing(listingId)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 transition-colors"
          >
            {dict.tryAgain || "Try Again"}
          </button>
        </div>
        <FormFooter
          config={ONBOARDING_CONFIG}
          basePath="/onboarding"
          dictionary={dictionary?.school?.onboarding}
          locale={locale}
          useValidation={useHostValidation}
          finalLabel={dict.createSchool}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-20">
      {children}
      <FormFooter
        config={ONBOARDING_CONFIG}
        basePath="/onboarding"
        dictionary={dictionary?.school?.onboarding}
        locale={locale}
        useValidation={useHostValidation}
        finalLabel={dict.createSchool}
      />
    </div>
  )
}

const HostLayout = ({ children }: HostLayoutProps) => {
  return (
    <ErrorBoundary>
      <ListingProvider>
        <HostValidationProvider>
          <HostLayoutContent>{children}</HostLayoutContent>
        </HostValidationProvider>
      </ListingProvider>
    </ErrorBoundary>
  )
}

export default HostLayout
