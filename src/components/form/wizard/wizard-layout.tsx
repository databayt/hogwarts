"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { ReactNode, useCallback, useEffect } from "react"
import { useParams } from "next/navigation"

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
  /** Whether to show logo in footer */
  showLogo?: boolean
  /** Whether to show help button in footer */
  showHelp?: boolean
  /** Whether to show save button in footer */
  showSave?: boolean
  children: ReactNode
}

// Convert WizardConfig to StepConfig for FormFooter
function toStepConfig(config: WizardConfig): StepConfig {
  return {
    steps: config.steps,
    groups: config.groups,
    groupLabels: config.groupLabels,
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
  showLogo = false,
  showHelp = false,
  showSave = false,
  children,
}: Omit<WizardLayoutProps, "dataProvider">) {
  const params = useParams()
  const { isLoading, error, loadData, reload } = loadHook()
  const { dictionary } = useDictionary()
  const { locale } = useLocale()
  const entityId = params[idParam] as string | null

  const handleStepChange = useCallback(
    (step: string) => {
      if (entityId && onStepChange) {
        onStepChange(entityId, step)
      }
    },
    [entityId, onStepChange]
  )

  useEffect(() => {
    if (entityId) {
      loadData(entityId)
    }
  }, [entityId, loadData])

  const stepConfig = toStepConfig(config)

  const footer = (
    <FormFooter
      config={stepConfig}
      basePath={basePath}
      idParam={idParam}
      dictionary={dictionary?.school?.onboarding}
      locale={locale}
      useValidation={useWizardValidation}
      finalLabel={finalLabel || config.finalLabel || "Finish"}
      finalDestination={finalDestination || config.finalDestination}
      onStepChange={handleStepChange}
      showLogo={showLogo}
      showHelp={showHelp}
      showSave={showSave}
    />
  )

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl pb-20">
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
        {footer}
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl pb-20">
        <div className="mx-auto max-w-md text-center">
          <h2>Unable to Load</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => (reload ? reload() : entityId && loadData(entityId))}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 transition-colors"
          >
            Try Again
          </button>
        </div>
        {footer}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-20">
      {children}
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
    <ErrorBoundary>
      <DataProvider>
        <WizardValidationProvider>
          <WizardLayoutContent {...contentProps}>
            {children}
          </WizardLayoutContent>
        </WizardValidationProvider>
      </DataProvider>
    </ErrorBoundary>
  )
}
