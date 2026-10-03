"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  Activity,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useParams, usePathname, useRouter } from "next/navigation"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorToast } from "@/components/atom/toast"
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
import { useWizardRuntime, WizardRuntimeProvider } from "./wizard-runtime"

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
    data?: unknown
    loadData: (id: string) => Promise<void>
    reload?: () => Promise<void>
  }
  /** Base path for navigation (e.g., "/teachers/add", "/onboarding") */
  basePath: string
  /** URL param name for the entity ID (default: "id") */
  idParam?: string
  /** Persist progress when the user moves forward to a new step (e.g. the
   *  wizardStep column). Runs in the save queue; skipped in edit mode. */
  onStepChange?: (entityId: string, step: string) => unknown
  /**
   * Step components keyed by slug. When given, steps switch in the browser:
   * the layout renders the step for the current path itself (route
   * `children` are ignored — the step pages stay for deep links and
   * refreshes), visited steps stay mounted under `<Activity>` so Back keeps
   * what was typed, and the next step pre-renders so its code is ready.
   */
  steps?: Record<string, React.ComponentType>
  /** Final step button label */
  finalLabel?: string
  /** Back button label override (defaults to dictionary.school.onboarding.back) */
  backLabel?: string
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
  /** Runs before Close navigates away — e.g. drop a draft nobody filled in.
   *  A failure is swallowed: Close must always close. */
  onClose?: (entityId: string) => Promise<unknown> | void
  /** Label for the skip button (default: "Skip & Create", use "Skip & Update" for edit mode) */
  skipLabel?: string
  /** Field name on entity data that tracks wizard progress (e.g., "wizardStep").
   *  When set and the field is null, the wizard is in edit mode (entity was previously completed).
   *  This changes labels from "Create" to "Update" and "Skip & Create" to "Skip & Update". */
  wizardStepField?: string
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
  backLabel,
  finalDestination,
  showClose = true,
  closeDestination,
  showLogo = false,
  showHelp = true,
  showSave = true,
  onComplete,
  onClose,
  skipLabel,
  wizardStepField,
  steps,
  scrollRef,
  children,
}: Omit<WizardLayoutProps, "dataProvider"> & {
  scrollRef: React.RefObject<HTMLDivElement | null>
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const runtime = useWizardRuntime()
  const { isLoading, error, loadData, reload, data } = loadHook()
  const { dictionary } = useDictionary()
  const { locale } = useLocale()
  const entityId = params[idParam] as string | null
  const { onSave } = useWizardValidation()
  const [isSaving, setIsSaving] = useState(false)

  // Detect create vs update mode from wizard step field.
  // wizardStep === null means the entity was previously completed → edit mode.
  const isEditMode =
    wizardStepField && data
      ? (data as Record<string, unknown>)[wizardStepField] === null
      : false

  const dict = dictionary?.school?.onboarding as
    | Record<string, string>
    | undefined
  const createLabel = dict?.create || "Create"
  const updateLabel = dict?.update || "Update"
  const skipWord = dict?.skip || "Skip"
  const resolvedFinalLabel =
    finalLabel || (isEditMode ? updateLabel : createLabel)
  const resolvedSkipLabel =
    skipLabel ||
    (isEditMode
      ? `${skipWord} & ${updateLabel}`
      : `${skipWord} & ${createLabel}`)

  // Derive close destination: strip /add from basePath
  const resolvedCloseDestination =
    closeDestination ?? basePath.replace(/\/add$/, "")

  const handleClose = useCallback(async () => {
    // Let the draft INSERT and any save still in flight land first — the
    // discard below matches the row as it really is, and nothing typed is
    // lost to a save that was cut off.
    await runtime?.drain({ revealFailure: false })
    if (entityId && onClose) {
      try {
        await onClose(entityId)
      } catch {
        // Close must always close.
      }
    }
    router.push(`/${locale}${resolvedCloseDestination}`)
  }, [entityId, onClose, router, locale, resolvedCloseDestination, runtime])

  const handleSave = useCallback(async () => {
    if (!onSave || isSaving) return
    setIsSaving(true)
    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }, [onSave, isSaving])

  // The step in the URL. With `steps`, this — not the route — picks what
  // renders, so a pushState step switch costs no request.
  const pathStep = pathname?.split("/").pop() ?? ""
  const currentStep = config.steps.includes(pathStep) ? pathStep : null
  const currentIndex = currentStep ? config.steps.indexOf(currentStep) : -1

  // Persist progress whenever the user reaches a step further than before.
  // (Every step registers custom navigation, so the footer's own
  // onStepChange path never ran and the wizard could not resume.)
  const furthestRef = useRef(currentIndex)
  useEffect(() => {
    if (!entityId || !onStepChange || !currentStep || isEditMode) return
    if (currentIndex <= furthestRef.current) return
    furthestRef.current = currentIndex
    runtime?.enqueue(() => onStepChange(entityId, currentStep))
  }, [entityId, onStepChange, currentStep, currentIndex, isEditMode, runtime])

  // A step switch keeps the overlay's scroll position; start each at the top.
  useEffect(() => {
    if (steps) scrollRef.current?.scrollTo({ top: 0 })
  }, [currentStep, steps, scrollRef])

  // A draft opened from "+" is written in the background. If that INSERT
  // fails (no permission, no school), nothing can be saved: say so, leave.
  const draftCreated = runtime?.draftCreated
  useEffect(() => {
    let cancelled = false
    draftCreated?.then((result) => {
      if (cancelled || result.success) return
      ErrorToast(
        actionErrorMessage(
          result.error,
          dictionary as any,
          (dictionary as any)?.common?.error || "Something went wrong"
        )
      )
      router.push(`/${locale}${resolvedCloseDestination}`)
    })
    return () => {
      cancelled = true
    }
  }, [draftCreated, dictionary, router, locale, resolvedCloseDestination])

  // Visited steps stay mounted (hidden) so Back is instant and keeps input.
  const [visited, setVisited] = useState<string[]>(() =>
    currentStep ? [currentStep] : []
  )
  if (steps && currentStep && !visited.includes(currentStep)) {
    setVisited([...visited, currentStep])
  }

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
    // Every optimistic save must have landed before the record is finished.
    if (runtime && !(await runtime.drain())) return
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
    runtime,
  ])

  const footer = (
    <FormFooter
      config={stepConfig}
      basePath={basePath}
      idParam={idParam}
      dictionary={dictionary?.school?.onboarding}
      locale={locale}
      useValidation={useWizardValidation}
      finalLabel={
        resolvedFinalLabel || resolveFinalLabel(config, locale) || "Finish"
      }
      backLabel={backLabel}
      finalDestination={finalDestination || config.finalDestination}
      showClose={showClose}
      onClose={handleClose}
      showLogo={showLogo}
      showHelp={showHelp}
      showSave={showSave}
      onSave={handleSave}
      isSaving={isSaving || (runtime?.pending ?? 0) > 0}
      requiredSteps={config.skipToComplete ? config.requiredSteps : undefined}
      onSkipToComplete={
        config.skipToComplete ? handleSkipToComplete : undefined
      }
      skipLabel={resolvedSkipLabel}
    />
  )

  // Steps read the row once, at mount (their forms take it as defaults), so
  // in steps mode they never mount before it exists. `isLoading` alone is not
  // enough: on a hard load the first render has no row yet and the loading
  // flag set by the effect below can land after the steps have mounted.
  if (isLoading || (steps && !data && !error)) {
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
    // `error` is an action error CODE (e.g. UNAUTHORIZED) — resolve it through
    // the dictionary; never print the code, and never a fixed English string.
    const common = (dictionary as any)?.common as
      | Record<string, string>
      | undefined
    return (
      <div className="flex min-h-full items-center justify-center pb-24">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto max-w-md text-center">
            <h2>{common?.failedToLoad || "Failed to load"}</h2>
            <p className="text-muted-foreground mb-4">
              {actionErrorMessage(
                error,
                dictionary as any,
                common?.error || "Something went wrong"
              )}
            </p>
            <button
              onClick={() =>
                reload ? reload() : entityId && loadData(entityId)
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 transition-colors"
            >
              {common?.tryAgain || "Try again"}
            </button>
          </div>
        </div>
        {footer}
      </div>
    )
  }

  let body: ReactNode = children
  if (steps && currentStep) {
    const nextStep = config.steps[currentIndex + 1]
    body = config.steps
      .filter(
        (step) =>
          steps[step] &&
          (step === currentStep || step === nextStep || visited.includes(step))
      )
      .map((step) => {
        const Step = steps[step]
        return (
          <Activity
            key={step}
            mode={step === currentStep ? "visible" : "hidden"}
          >
            <Step />
          </Activity>
        )
      })
  }

  return (
    <div className="flex min-h-full items-center justify-center pb-24">
      <div className="mx-auto w-full max-w-5xl">{body}</div>
      {footer}
    </div>
  )
}

export function WizardLayout({
  dataProvider: DataProvider,
  children,
  ...contentProps
}: WizardLayoutProps) {
  const params = useParams()
  const { locale } = useLocale()
  const scrollRef = useRef<HTMLDivElement>(null)
  const entityId =
    (params[contentProps.idParam ?? "id"] as string | undefined) ?? null
  const scope = entityId ? `/${locale}${contentProps.basePath}/${entityId}` : null

  return (
    <div
      ref={scrollRef}
      className="bg-background fixed inset-0 z-50 overflow-y-auto"
    >
      <ErrorBoundary>
        <DataProvider>
          <WizardValidationProvider>
            <WizardRuntimeProvider
              locale={locale}
              scope={scope}
              steps={contentProps.config.steps}
              clientSteps={!!contentProps.steps}
              entityId={entityId}
            >
              <WizardLayoutContent {...contentProps} scrollRef={scrollRef}>
                {children}
              </WizardLayoutContent>
            </WizardRuntimeProvider>
          </WizardValidationProvider>
        </DataProvider>
      </ErrorBoundary>
    </div>
  )
}
