"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useParams, useRouter } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { FormFooter } from "@/components/form/footer"
import type { StepConfig } from "@/components/form/footer"
import {
  useWizardValidation,
  WizardValidationProvider,
} from "@/components/form/template/wizard-validation-context"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { ErrorBoundary } from "@/components/onboarding/error-boundary"

import type { WizardConfig } from "./config"
import { resolveFinalLabel, resolveGroupLabels } from "./config"

/**
 * Generic Wizard Layout
 *
 * Composable layout that renders the standard wizard provider stack:
 * ErrorBoundary → DataProvider → WizardValidationProvider → Content + FormFooter
 *
 * @example
 * ```tsx
 * // In a layout.tsx file
 * import { WizardLayout } from "@/components/form/wizard"
 * import { TeacherWizardProvider, useTeacherWizard } from "./use-teacher-wizard"
 * import { TEACHER_WIZARD_CONFIG } from "./config"
 *
 * export default function TeacherAddLayout({ children }) {
 *   return (
 *     <WizardLayout
 *       config={TEACHER_WIZARD_CONFIG}
 *       dataProvider={TeacherWizardProvider}
 *       loadHook={useTeacherWizard}
 *       basePath="/teachers/add"
 *     >
 *       {children}
 *     </WizardLayout>
 *   )
 * }
 * ```
 */

interface WizardLayoutProps {
  /** Wizard step and group configuration */
  config: WizardConfig
  /** Data provider component that wraps the wizard (created via createWizardProvider) */
  dataProvider: React.ComponentType<{ children: ReactNode }>
  /** Hook to access data provider state (isLoading, error, loadData) */
  loadHook: () => {
    isLoading: boolean
    error: string | null
    loadData: (id: string) => Promise<void>
    reload?: () => Promise<void>
  }
  /** Base path for navigation (e.g., "/teachers/add", "/onboarding") */
  basePath: string
  /** URL param name for the entity ID (default: "id") */
  idParam?: string
  /** Callback when navigating to a new step (e.g., to persist wizardStep) */
  onStepChange?: (entityId: string, step: string) => void
  /** Final step button label */
  finalLabel?: string
  /** Redirect destination after the final step */
  finalDestination?: string
  /** Whether to show close button in footer (default: true for wizards) */
  showClose?: boolean
  /** Where close button navigates to (default: basePath without /add) */
  closeDestination?: string
  /** Whether to show logo in footer */
  showLogo?: boolean
  /** Whether to show help button in footer */
  showHelp?: boolean
  /** Whether to show save button in footer */
  showSave?: boolean
  /** Callback to complete the wizard early (skip remaining optional steps) */
  onComplete?: (entityId: string) => Promise<void>
  /** Label for the skip button (default: "Skip & Create", use "Skip & Update" for edit mode) */
  skipLabel?: string
  children: ReactNode
}

// Convert WizardConfig to StepConfig for FormFooter (locale-aware)
function toStepConfig(config: WizardConfig, locale?: string): StepConfig {
  return {
    steps: config.steps,
    groups: config.groups,
    groupLabels: locale
      ? resolveGroupLabels(config, locale)
      : config.groupLabels,
  }
}

function WizardLayoutContent({
  config,
  loadHook,
  basePath,
  idParam = "id",
  onStepChange,
  finalLabel,
  finalDestination,
  showClose = true,
  closeDestination,
  showLogo = false,
  showHelp = true,
  showSave = true,
  onComplete,
  skipLabel,
  children,
}: Omit<WizardLayoutProps, "dataProvider">) {
  const params = useParams()
  const router = useRouter()
  const { isLoading, error, loadData, reload } = loadHook()
  const { dictionary } = useDictionary()
  const { locale } = useLocale()
  const entityId = params[idParam] as string | null
  const { onSave } = useWizardValidation()
  const [isSaving, setIsSaving] = useState(false)

  // Derive close destination: strip /add from basePath
  const resolvedCloseDestination =
    closeDestination ?? basePath.replace(/\/add$/, "")

  const handleClose = useCallback(() => {
    router.push(
      `/${locale}/s/${params.subdomain as string}${resolvedCloseDestination}`
    )
  }, [router, locale, params.subdomain, resolvedCloseDestination])

  const handleSave = useCallback(async () => {
    if (!onSave || isSaving) return
    setIsSaving(true)
    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }, [onSave, isSaving])

  const handleStepChange = useCallback(
    (step: string) => {
      if (entityId && onStepChange) {
        onStepChange(entityId, step)
      }
    },
    [entityId, onStepChange]
  )

  const loadedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (entityId && entityId !== loadedIdRef.current) {
      loadedIdRef.current = entityId
      loadData(entityId)
    }
  }, [entityId, loadData])

  const stepConfig = toStepConfig(config, locale)

  const handleSkipToComplete = useCallback(async () => {
    if (!entityId) return
    try {
      await onComplete?.(entityId)
      const dest = finalDestination || config.finalDestination
      if (dest) {
        router.push(`/${locale}${dest}`)
      }
    } catch {
      // Error handled by onComplete
    }
  }, [
    entityId,
    onComplete,
    finalDestination,
    config.finalDestination,
    router,
    locale,
  ])

  const footer = (
    <FormFooter
      config={stepConfig}
      basePath={basePath}
      idParam={idParam}
      dictionary={dictionary?.school?.onboarding}
      locale={locale}
      useValidation={useWizardValidation}
      finalLabel={finalLabel || resolveFinalLabel(config, locale) || "Finish"}
      finalDestination={finalDestination || config.finalDestination}
      onStepChange={handleStepChange}
      showClose={showClose}
      onClose={handleClose}
      showLogo={showLogo}
      showHelp={showHelp}
      showSave={showSave}
      onSave={handleSave}
      isSaving={isSaving}
      requiredSteps={config.skipToComplete ? config.requiredSteps : undefined}
      onSkipToComplete={
        config.skipToComplete ? handleSkipToComplete : undefined
      }
      skipLabel={skipLabel}
    />
  )

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center pb-24">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex w-full flex-col gap-6 lg:flex-row lg:justify-between lg:gap-10">
            <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
              <div className="space-y-3 text-start sm:space-y-4">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>
            <div className="w-full lg:w-auto lg:shrink-0 lg:basis-[48%]">
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
        {footer}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center pb-24">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto max-w-md text-center">
            <h2>Unable to Load</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() =>
                reload ? reload() : entityId && loadData(entityId)
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        {footer}
      </div>
    )
  }

  return (
    <div className="flex min-h-full items-center justify-center pb-24">
      <div className="mx-auto w-full max-w-5xl">{children}</div>
      {footer}
    </div>
  )
}

export function WizardLayout({
  dataProvider: DataProvider,
  children,
  ...contentProps
}: WizardLayoutProps) {
  return (
    <div className="bg-background fixed inset-0 z-50 overflow-y-auto">
      <ErrorBoundary>
        <DataProvider>
          <WizardValidationProvider>
            <WizardLayoutContent {...contentProps}>
              {children}
            </WizardLayoutContent>
          </WizardValidationProvider>
        </DataProvider>
      </ErrorBoundary>
    </div>
  )
}
