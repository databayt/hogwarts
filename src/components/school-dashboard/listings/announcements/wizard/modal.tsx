"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"

import { resolveActionError } from "@/lib/resolve-action-error"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { FormHeading, FormLayout } from "@/components/form"
import { FormFooter, type StepConfig } from "@/components/form/footer"
import {
  useWizardValidation,
  WizardValidationProvider,
} from "@/components/form/template/wizard-validation-context"
import {
  resolveGroupLabels,
  type WizardFormRef,
} from "@/components/form/wizard"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { submitAnnouncementWizard } from "./actions"
import { ANNOUNCEMENT_WIZARD_CONFIG } from "./config"
import { getAnnouncementContent } from "./content/actions"
import { ContentForm } from "./content/form"
import type { ContentFormData } from "./content/validation"

/**
 * Announcement wizard, in place.
 *
 * This renders the exact component stack the `/announcements/add/[id]/content`
 * route renders — same overlay container, same FormLayout/FormHeading/ContentForm,
 * same FormFooter with the same progress bar — but mounted where the user already
 * is. What it drops is everything that made the routed version feel janky: the
 * blocking draft-creation round-trip before the first paint, the route
 * transition, and the re-fetch of a draft that was empty by construction.
 *
 * Creating now costs zero server calls to open and exactly one to submit.
 */

export interface AnnouncementSaveResult {
  id: string
  isNew: boolean
  values: ContentFormData
}

interface AnnouncementWizardModalProps {
  open: boolean
  /** Announcement being edited. Omit (or null) to create a new one. */
  announcementId?: string | null
  dictionary: Dictionary["school"]["announcements"]
  onOpenChange: (open: boolean) => void
  /** Fired after a successful save so the caller can update its list. */
  onSaved: (result: AnnouncementSaveResult) => void
}

export function AnnouncementWizardModal({
  open,
  announcementId,
  dictionary,
  onOpenChange,
  onSaved,
}: AnnouncementWizardModalProps) {
  if (!open) return null

  return (
    // The route version was a page, so it needed no dialog semantics. As an
    // overlay it does: without these the background stays in the a11y tree and
    // screen readers never learn a dialog opened.
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        announcementId
          ? dictionary.editAnnouncement
          : dictionary.createAnnouncement
      }
      className="bg-background fixed inset-0 z-50 overflow-y-auto"
    >
      <WizardValidationProvider>
        {/* Remount per announcement so form state never leaks between opens. */}
        <AnnouncementWizardModalContent
          key={announcementId ?? "new"}
          announcementId={announcementId}
          dictionary={dictionary}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      </WizardValidationProvider>
    </div>
  )
}

function AnnouncementWizardModalContent({
  announcementId,
  dictionary,
  onOpenChange,
  onSaved,
}: Omit<AnnouncementWizardModalProps, "open">) {
  const t = dictionary
  const { dictionary: fullDictionary } = useDictionary()
  const { locale } = useLocale()
  const { enableNext, disableNext } = useWizardValidation()

  const formRef = useRef<WizardFormRef>(null)
  const savedRef = useRef<AnnouncementSaveResult | null>(null)

  const isEdit = !!announcementId
  // Held in state, not derived: after a "Save" on a new announcement the row
  // exists, and the next submit must update it rather than create a duplicate.
  const [entityId, setEntityId] = useState<string | null>(
    announcementId ?? null
  )
  const [initialData, setInitialData] = useState<
    Partial<ContentFormData> | undefined
  >(isEdit ? undefined : {})
  // Creating has nothing to load, so it paints immediately.
  const [isLoading, setIsLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  // Load existing content (edit only).
  useEffect(() => {
    if (!announcementId) return
    let active = true
    setIsLoading(true)
    getAnnouncementContent(announcementId).then((res) => {
      if (!active) return
      if (res.success && res.data) {
        setInitialData(res.data)
      } else {
        setLoadError(
          resolveActionError(res.error ?? "", fullDictionary) || t.error
        )
      }
      setIsLoading(false)
    })
    return () => {
      active = false
    }
  }, [announcementId, fullDictionary, t.error])

  // Drive the footer's Next/Create button, exactly as WizardStep does on the route.
  useEffect(() => {
    if (isValid) enableNext()
    else disableNext()
  }, [isValid, enableNext, disableNext])

  // Escape closes, matching every other overlay in the dashboard.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) close()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [close, isSaving])

  // Lock background scroll while the overlay is up.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  /** Single round-trip: create-or-update, and complete the wizard. */
  const submit = useCallback(
    async (values: ContentFormData) => {
      const res = await submitAnnouncementWizard({ ...values, id: entityId })
      if (!res.success || !res.data) {
        ErrorToast(
          resolveActionError(res.error ?? "", fullDictionary) ||
            (entityId ? t.failedToUpdate : t.failedToCreate)
        )
        throw new Error(res.error ?? "SAVE_FAILED")
      }
      savedRef.current = {
        id: res.data.id,
        isNew: !entityId,
        values,
      }
    },
    [entityId, fullDictionary, t.failedToCreate, t.failedToUpdate]
  )

  const runSave =
    useCallback(async (): Promise<AnnouncementSaveResult | null> => {
      if (isSaving) return null
      setIsSaving(true)
      savedRef.current = null
      try {
        // Validates, then calls submit() above.
        await formRef.current?.saveAndNext()
        // Asserted because control-flow analysis still sees the `null` this ref
        // was reset to above — submit() fills it in from inside saveAndNext().
        const saved = savedRef.current as AnnouncementSaveResult | null
        if (!saved) return null
        SuccessToast(
          saved.isNew ? t.announcementCreated : t.announcementUpdated
        )
        setEntityId(saved.id)
        onSaved(saved)
        return saved
      } catch {
        // Already reported by submit() or surfaced as a field error.
        return null
      } finally {
        setIsSaving(false)
      }
    }, [isSaving, onSaved, t.announcementCreated, t.announcementUpdated])

  /** Create/Update — save, then close. This is the auto-close the route lacked. */
  const handleNext = useCallback(async () => {
    const saved = await runSave()
    if (saved) close()
  }, [runSave, close])

  /** Bookmark icon — persist without leaving the form. */
  const handleSave = useCallback(async () => {
    await runSave()
  }, [runSave])

  // Same headings the routed step renders, so the two stay in step.
  const wc = t.wizard?.content
  const onboarding = fullDictionary?.school?.onboarding as
    | Record<string, string>
    | undefined

  const stepConfig: StepConfig = {
    steps: ANNOUNCEMENT_WIZARD_CONFIG.steps,
    groups: ANNOUNCEMENT_WIZARD_CONFIG.groups,
    groupLabels: resolveGroupLabels(ANNOUNCEMENT_WIZARD_CONFIG, locale),
  }

  const footer = (
    <FormFooter
      config={stepConfig}
      basePath="/announcements/add"
      dictionary={onboarding}
      locale={locale}
      useValidation={useWizardValidation}
      finalLabel={
        isEdit ? onboarding?.update || "Update" : onboarding?.create || "Create"
      }
      onNext={handleNext}
      showClose
      onClose={close}
      showLogo={false}
      showHelp
      showSave
      onSave={handleSave}
      isSaving={isSaving}
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

  if (loadError) {
    return (
      <div className="flex min-h-full items-center justify-center pb-24">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto max-w-md text-center">
            <h2>{t.error}</h2>
            <p className="text-muted-foreground mb-4">{loadError}</p>
          </div>
        </div>
        {footer}
      </div>
    )
  }

  return (
    <div className="flex min-h-full items-center justify-center pb-24">
      <div className="mx-auto w-full max-w-5xl">
        <FormLayout>
          <FormHeading
            title={wc?.title || "Announcement Content"}
            description={
              wc?.description || "Enter the announcement title and body."
            }
          />
          <ContentForm
            ref={formRef}
            announcementId={entityId ?? undefined}
            initialData={initialData}
            onValidChange={setIsValid}
            onSubmit={submit}
          />
        </FormLayout>
      </div>
      {footer}
    </div>
  )
}

export default AnnouncementWizardModal
