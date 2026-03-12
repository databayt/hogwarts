"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect } from "react"
import { useParams } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { FormFooter, ONBOARDING_CONFIG } from "@/components/form/footer"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { updateOnboardingStep } from "@/components/onboarding/actions"
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

  const handleStepChange = useCallback(
    (step: string) => {
      if (listingId) {
        updateOnboardingStep(listingId, step)
      }
    },
    [listingId]
  )

  useEffect(() => {
    if (listingId) {
      loadListing(listingId)
    }
  }, [listingId, loadListing])

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl pb-20">
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:justify-between lg:gap-10">
          {/* Left - heading area */}
          <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
            <div className="space-y-3 text-start sm:space-y-4">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          {/* Right - form area */}
          <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
        </div>
        <FormFooter
          config={ONBOARDING_CONFIG}
          basePath="/onboarding"
          dictionary={dictionary?.school?.onboarding}
          locale={locale}
          useValidation={useHostValidation}
          finalLabel={dict.create || "Create"}
          onStepChange={handleStepChange}
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
          finalLabel={dict.create || "Create"}
          onStepChange={handleStepChange}
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
        finalLabel={dict.create || "Create"}
        onStepChange={handleStepChange}
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
