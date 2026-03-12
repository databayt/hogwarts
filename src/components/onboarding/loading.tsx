// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Skeleton } from "@/components/ui/skeleton"

// =============================================================================
// BASE: Two-column layout matching FormLayout + FormHeading
// =============================================================================

function OnboardingFormSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:justify-between lg:gap-10">
      <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
        <div className="space-y-3 text-start sm:space-y-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
        {children}
      </div>
    </div>
  )
}

// =============================================================================
// STEP SKELETONS
// =============================================================================

export function TitleSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <Skeleton className="h-12 w-full rounded-md" />
    </OnboardingFormSkeleton>
  )
}

export function DescriptionSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <Skeleton className="h-32 w-full rounded-md" />
    </OnboardingFormSkeleton>
  )
}

export function LocationSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    </OnboardingFormSkeleton>
  )
}

export function CapacitySkeleton() {
  return (
    <OnboardingFormSkeleton>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </OnboardingFormSkeleton>
  )
}

export function ScheduleSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <div className="space-y-4">
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-3 w-64" />
      </div>
    </OnboardingFormSkeleton>
  )
}

export function BrandingSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <Skeleton className="h-[300px] w-full rounded-lg" />
    </OnboardingFormSkeleton>
  )
}

export function ImportSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-lg border-2 border-dashed" />
        <Skeleton className="h-48 w-full rounded-lg border-2 border-dashed" />
      </div>
    </OnboardingFormSkeleton>
  )
}

export function PriceSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </OnboardingFormSkeleton>
  )
}

export function DiscountSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </OnboardingFormSkeleton>
  )
}

export function LegalSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </OnboardingFormSkeleton>
  )
}

export function SubdomainSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <div className="flex items-center gap-2">
        <Skeleton className="h-12 flex-1 rounded-md" />
        <Skeleton className="h-6 w-32" />
      </div>
    </OnboardingFormSkeleton>
  )
}

export function VisibilitySkeleton() {
  return (
    <OnboardingFormSkeleton>
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </OnboardingFormSkeleton>
  )
}

export function JoinSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </OnboardingFormSkeleton>
  )
}

export function FinishSetupSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 flex-1" />
          </div>
        ))}
      </div>
    </OnboardingFormSkeleton>
  )
}

export function StandOutSkeleton() {
  return (
    <OnboardingFormSkeleton>
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </OnboardingFormSkeleton>
  )
}

export function AboutSchoolSkeleton() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-12">
        {/* Left Side - Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* "Step 1" label */}
          <Skeleton className="h-4 w-16 sm:h-5" />
          {/* Title */}
          <Skeleton className="h-10 w-72" />
          {/* Description - 2 lines */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full sm:h-5" />
            <Skeleton className="h-4 w-4/5 sm:h-5" />
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="order-first block lg:order-last lg:block">
          <Skeleton className="mx-auto h-[200px] w-full max-w-xl rounded-xl sm:w-3/4 sm:rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SPECIAL LAYOUTS (not FormLayout-based)
// =============================================================================

export function CongratulationsSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-8 text-center">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto h-12 w-64" />
        <Skeleton className="mx-auto h-6 w-96" />
        <Skeleton className="mx-auto h-12 w-48 rounded-md" />
      </div>
    </div>
  )
}

export function OnboardingEntrySkeleton() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <div className="mx-auto w-full max-w-xl space-y-3 px-3 sm:space-y-4 sm:px-4">
        {/* Welcome Header — always present */}
        <div>
          <Skeleton className="mb-3 h-7 w-32 sm:mb-4 sm:h-8" />
        </div>

        {/* New school options — always present */}
        <div className="space-y-2 sm:space-y-3">
          <Skeleton className="h-5 w-40 sm:h-6" />
          <div className="space-y-2">
            {/* "Create a new school" row */}
            <div className="flex min-h-[50px] items-center gap-2 border-b py-2 sm:min-h-[60px] sm:py-3">
              <Skeleton className="h-8 w-8 flex-shrink-0 rounded-lg sm:h-10 sm:w-10" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36 sm:h-5" />
                <Skeleton className="h-3 w-52 sm:h-3.5" />
              </div>
            </div>
            {/* "Create from template" row */}
            <div className="flex min-h-[50px] items-center gap-2 border-b py-2 sm:min-h-[60px] sm:py-3">
              <Skeleton className="h-8 w-8 flex-shrink-0 rounded-lg sm:h-10 sm:w-10" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40 sm:h-5" />
                <Skeleton className="h-3 w-56 sm:h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OnboardingOverviewSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-6 w-80" />
      <div className="grid gap-6 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-4 rounded-lg border p-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
