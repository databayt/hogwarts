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
  const dict = (dictionary?.school?.onboarding || {}) as any

  useEffect(() => {
    if (listingId) {
      loadListing(listingId)
    }
  }, [listingId, loadListing])

  // Get current page from pathname
  const getCurrentPage = () => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname
      const segments = pathname.split("/")
      return segments[segments.length - 1] || "about-school"
    }
    return "about-school"
  }

  // Render appropriate skeleton based on current page
  const renderPageSkeleton = () => {
    const currentPage = getCurrentPage()

    // Two-column with image (about-school, stand-out, finish-setup)
    if (["about-school", "stand-out", "finish-setup"].includes(currentPage)) {
      return (
        <div className="-mt-6 w-full sm:-mt-10">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4 sm:space-y-6">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="mx-auto flex h-[300px] w-full max-w-xl items-center justify-center sm:aspect-video sm:w-3/4">
              <Skeleton className="h-48 w-48 rounded-full" />
            </div>
          </div>
        </div>
      )
    }

    // Two-column with form (title, description, location, capacity)
    if (
      ["title", "description", "location", "capacity"].includes(currentPage)
    ) {
      return (
        <div className="w-full">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-20">
            <div className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Branding page
    if (currentPage === "branding") {
      return (
        <div className="w-full">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-20">
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="space-y-5">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          </div>
        </div>
      )
    }

    // Import page
    if (currentPage === "import") {
      return (
        <div className="w-full">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-20">
            <div className="space-y-3 sm:space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div>
              <Skeleton className="h-[250px] w-full rounded-lg" />
            </div>
          </div>
        </div>
      )
    }

    // Join and Visibility pages (multi-column with options)
    if (["join", "visibility"].includes(currentPage)) {
      return (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5 lg:gap-16">
          <div className="space-y-3 sm:space-y-4 lg:col-span-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="space-y-3 sm:space-y-4 lg:col-span-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      )
    }

    // Price page
    if (currentPage === "price") {
      return (
        <div className="space-y-6">
          <Skeleton className="h-20 w-48" />
          <Skeleton className="h-10 w-64 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      )
    }

    // Discount page
    if (currentPage === "discount") {
      return (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      )
    }

    // Legal page
    if (currentPage === "legal") {
      return (
        <div>
          <div className="mb-6 sm:mb-8">
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5 lg:gap-20">
            <div className="lg:col-span-2">
              <Skeleton className="mb-4 h-6 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4 lg:col-span-3">
              <Skeleton className="mb-3 h-6 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Default skeleton (two-column with image)
    return (
      <div className="-mt-6 w-full sm:-mt-10">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4 sm:space-y-6">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="mx-auto flex h-[300px] w-full max-w-xl items-center justify-center sm:aspect-video sm:w-3/4">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while fetching school data
  if (isLoading) {
    return (
      <div className="pb-20">
        {renderPageSkeleton()}
        <FormFooter
          config={ONBOARDING_CONFIG}
          basePath="/onboarding"
          dictionary={dictionary?.school?.onboarding}
          locale={locale}
          useValidation={useHostValidation}
          finalLabel={dictionary?.school?.onboarding?.createSchool}
        />
      </div>
    )
  }

  // Show error state if loading failed
  if (error) {
    return (
      <div className="pb-20">
        <div className="max-w-md text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2>{dict.unableToLoadSchool || "Unable to Load School"}</h2>
          <p className="muted mb-4">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => listingId && loadListing(listingId)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 transition-colors"
            >
              {dict.tryAgain || "Try Again"}
            </button>
            <button
              onClick={() => (window.location.href = "/onboarding/overview")}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2 transition-colors"
            >
              {dict.backToOverview || "Back to Overview"}
            </button>
          </div>
        </div>
        <FormFooter
          config={ONBOARDING_CONFIG}
          basePath="/onboarding"
          dictionary={dictionary?.school?.onboarding}
          locale={locale}
          useValidation={useHostValidation}
          finalLabel={dictionary?.school?.onboarding?.createSchool}
        />
      </div>
    )
  }

  return (
    <div className="pb-20">
      {children}
      <FormFooter
        config={ONBOARDING_CONFIG}
        basePath="/onboarding"
        dictionary={dictionary?.school?.onboarding}
        locale={locale}
        useValidation={useHostValidation}
        finalLabel={dictionary?.school?.onboarding?.createSchool}
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
