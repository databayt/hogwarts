"use client"

import React, { useMemo } from "react"
import Image from "next/image"
import { useParams, usePathname, useRouter } from "next/navigation"
import { Bookmark, Check, HelpCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatRelativeTime } from "@/components/file/formatters"
import { useLocale } from "@/components/internationalization/use-locale"

// =============================================================================
// TYPES
// =============================================================================

export interface StepConfig {
  /** All steps in order */
  steps: string[]
  /** Group steps into phases for progress display */
  groups: Record<number, string[]>
  /** Labels for each group (progress bar labels) */
  groupLabels?: string[]
}

export interface CustomNavigation {
  onBack?: () => void
  onNext?: () => void
  nextDisabled?: boolean
}

export interface ValidationContext {
  isNextDisabled: boolean
  customNavigation?: CustomNavigation
}

export interface FormFooterProps {
  /** Step configuration - defines the wizard flow */
  config: StepConfig
  /** Base path for navigation (e.g., "/onboarding", "/admission") */
  basePath: string
  /** Parameter name for the entity ID (default: "id") */
  idParam?: string
  /** Callback for back navigation */
  onBack?: () => void
  /** Callback for next navigation */
  onNext?: () => void
  /** Callback for help button */
  onHelp?: () => void
  /** Callback for save button */
  onSave?: () => void
  /** Custom back button label */
  backLabel?: string
  /** Custom next button label */
  nextLabel?: string
  /** Custom final step button label */
  finalLabel?: string
  /** Destination after final step */
  finalDestination?: string
  /** Whether back navigation is allowed */
  canGoBack?: boolean
  /** Whether next navigation is allowed */
  canGoNext?: boolean
  /** Disable next button */
  nextDisabled?: boolean
  /** Dictionary for translations - accepts any nested structure */
  dictionary?: Record<string, unknown>
  /** Locale override */
  locale?: string
  /** Show logo */
  showLogo?: boolean
  /** Logo src */
  logoSrc?: string
  /** Show help button */
  showHelp?: boolean
  /** Show save button */
  showSave?: boolean
  /** Custom validation context hook */
  useValidation?: () => ValidationContext
  /** Show save status indicator (last saved time, saving spinner) */
  showSaveStatus?: boolean
  /** Last saved timestamp */
  lastSaved?: Date | null
  /** Is currently saving */
  isSaving?: boolean
  /** Saving label (default: "Saving...") */
  savingLabel?: string
  /** Last saved label template with {time} placeholder (default: "Last saved {time}") */
  lastSavedTemplate?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function FormFooter({
  config,
  basePath,
  idParam = "id",
  onBack,
  onNext,
  onHelp,
  onSave,
  backLabel,
  nextLabel,
  finalLabel,
  finalDestination = "/dashboard",
  canGoBack = true,
  canGoNext = true,
  nextDisabled = false,
  dictionary,
  locale: propLocale,
  showLogo = true,
  logoSrc = "/logo.png",
  showHelp = true,
  showSave = true,
  useValidation,
  showSaveStatus = false,
  lastSaved,
  isSaving = false,
  savingLabel,
  lastSavedTemplate,
}: FormFooterProps) {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const { locale: hookLocale } = useLocale()

  const locale = propLocale || hookLocale
  const isRTL = locale === "ar"
  const entityId = params[idParam] as string

  // Use validation context if provided
  let contextNextDisabled = false
  let customNavigation: CustomNavigation | undefined

  if (useValidation) {
    try {
      const validationContext = useValidation()
      contextNextDisabled = validationContext.isNextDisabled
      customNavigation = validationContext.customNavigation
    } catch {
      // Context not available
    }
  }

  // Extract current step from pathname
  const { currentStepIndex, currentStepSlug } = useMemo(() => {
    const pathSegments = pathname.split("/")
    const slug = pathSegments[pathSegments.length - 1]
    const index = config.steps.findIndex((step) => step === slug)
    return {
      currentStepIndex: index === -1 ? 0 : index,
      currentStepSlug: index === -1 ? config.steps[0] : slug,
    }
  }, [pathname, config.steps])

  // Determine which step group we're in
  const currentStepGroup = useMemo(() => {
    for (const [group, steps] of Object.entries(config.groups)) {
      if (steps.includes(currentStepSlug)) {
        return parseInt(group)
      }
    }
    return 1
  }, [currentStepSlug, config.groups])

  const isLastStep = currentStepIndex === config.steps.length - 1

  // Navigation handlers
  const handleBack = () => {
    if (customNavigation?.onBack) {
      customNavigation.onBack()
      return
    }

    if (onBack) {
      onBack()
      return
    }

    if (currentStepIndex > 0) {
      const prevStep = config.steps[currentStepIndex - 1]
      router.push(`${basePath}/${entityId}/${prevStep}`)
    }
  }

  const handleNext = () => {
    if (customNavigation?.onNext) {
      customNavigation.onNext()
      return
    }

    if (onNext) {
      onNext()
      return
    }

    if (isLastStep) {
      router.push(finalDestination)
      return
    }

    if (currentStepIndex < config.steps.length - 1) {
      const nextStep = config.steps[currentStepIndex + 1]
      router.push(`${basePath}/${entityId}/${nextStep}`)
    }
  }

  // Calculate progress for each step group
  const getStepProgress = (stepNumber: number) => {
    if (currentStepGroup > stepNumber) return 100
    if (currentStepGroup === stepNumber) {
      const groupSteps = config.groups[stepNumber as keyof typeof config.groups]
      if (!groupSteps) return 0
      const currentStepInGroup = groupSteps.findIndex(
        (step) => step === currentStepSlug
      )
      return Math.max(10, ((currentStepInGroup + 1) / groupSteps.length) * 100)
    }
    return 0
  }

  // Labels
  const dict = (dictionary || {}) as Record<string, string | undefined>
  const stepTemplate = dict.stepN || "Step {n}"
  const groupLabels =
    config.groupLabels ||
    Object.keys(config.groups).map((_, i) =>
      stepTemplate.replace("{n}", String(i + 1))
    )
  const actualBackLabel = backLabel || dict.back || "Back"
  const actualNextLabel = isLastStep
    ? finalLabel || dict.finish || "Finish"
    : nextLabel || dict.next || "Next"

  // Button states
  const canGoBackActual = canGoBack && currentStepIndex > 0
  const canGoNextActual =
    canGoNext &&
    !nextDisabled &&
    !contextNextDisabled &&
    !customNavigation?.nextDisabled

  const groupCount = Object.keys(config.groups).length

  return (
    <footer className="bg-background fixed right-0 bottom-0 left-0 px-4 sm:px-6 md:px-12 lg:px-20">
      {/* Progress bars */}
      <div dir="ltr" className="mx-auto max-w-5xl">
        <div
          className="gap-1 sm:gap-2"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${groupCount}, 1fr)`,
          }}
        >
          {groupLabels.slice(0, groupCount).map((_, index) => (
            <Progress
              key={index}
              value={getStepProgress(index + 1)}
              className="h-1 w-full"
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mx-auto flex max-w-5xl items-center justify-between py-3 sm:py-4 rtl:flex-row-reverse">
        {/* Left side - Logo, Help, Save */}
        <div className="flex items-center gap-1 rtl:flex-row-reverse">
          {showLogo && (
            <div className="relative flex h-8 w-8 items-center justify-center">
              <div className="relative h-6 w-6">
                <Image
                  src={logoSrc}
                  alt="Logo"
                  fill
                  sizes="24px"
                  className="object-contain"
                />
              </div>
            </div>
          )}
          {showHelp && (
            <Button
              variant="link"
              size="icon"
              onClick={onHelp}
              className="hover:bg-muted h-8 w-8 rounded-full p-0"
              aria-label={dict.help || "Help"}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          )}
          {showSave && (
            <Button
              variant="link"
              size="icon"
              onClick={onSave}
              disabled={isSaving}
              className="hover:bg-muted h-8 w-8 rounded-full p-0"
              aria-label={dict.save || "Save"}
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          )}
          {/* Save status indicator */}
          {showSaveStatus && (
            <>
              {lastSaved && !isSaving && (
                <div className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex rtl:flex-row-reverse">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>
                    {(
                      lastSavedTemplate ||
                      (isRTL ? "آخر حفظ {time}" : "Last saved {time}")
                    ).replace("{time}", formatRelativeTime(lastSaved))}
                  </span>
                </div>
              )}
              {isSaving && (
                <span className="text-muted-foreground hidden text-xs sm:inline">
                  {savingLabel || (isRTL ? "جاري الحفظ..." : "Saving...")}
                </span>
              )}
            </>
          )}
        </div>

        {/* Right side - Back and Next buttons */}
        <div className="flex items-center gap-2 sm:gap-4 rtl:flex-row-reverse">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={!canGoBackActual}
            size="sm"
          >
            {actualBackLabel}
          </Button>

          <Button onClick={handleNext} disabled={!canGoNextActual} size="sm">
            {actualNextLabel}
          </Button>
        </div>
      </div>
    </footer>
  )
}

// =============================================================================
// PRESET CONFIGS
// =============================================================================

/** Onboarding flow configuration */
export const ONBOARDING_CONFIG: StepConfig = {
  steps: [
    "about-school",
    "title",
    "description",
    "location",
    "stand-out",
    "capacity",
    "branding",
    "import",
    "finish-setup",
    "join",
    "visibility",
    "price",
    "discount",
    "legal",
    "subdomain",
  ],
  groups: {
    1: ["about-school", "title", "description", "location", "stand-out"],
    2: ["capacity", "branding", "import", "finish-setup"],
    3: ["join", "visibility", "price", "discount", "legal", "subdomain"],
  },
  groupLabels: [
    "Tell us about your school",
    "Set up your school",
    "Finish up and publish",
  ],
}

/** Admission application flow configuration */
export const ADMISSION_CONFIG: StepConfig = {
  steps: ["personal", "contact", "guardian", "academic", "documents", "review"],
  groups: {
    1: ["personal", "contact"],
    2: ["guardian", "academic"],
    3: ["documents", "review"],
  },
  groupLabels: ["Basic Information", "Family & Education", "Finalize"],
}

/** Generic application flow configuration */
export const APPLICATION_CONFIG: StepConfig = {
  steps: ["info", "details", "documents", "review"],
  groups: {
    1: ["info", "details"],
    2: ["documents", "review"],
  },
  groupLabels: ["Information", "Documents & Review"],
}

export default FormFooter
