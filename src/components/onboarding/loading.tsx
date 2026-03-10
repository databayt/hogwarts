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
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-48 w-full rounded-lg" />
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
    <OnboardingFormSkeleton>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    </OnboardingFormSkeleton>
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
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-2xl space-y-8 p-8">
        <Skeleton className="mx-auto h-12 w-48" />
        <Skeleton className="mx-auto h-6 w-80" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
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
