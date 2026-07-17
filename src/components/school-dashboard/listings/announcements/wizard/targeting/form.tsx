"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { resolveActionError } from "@/lib/resolve-action-error"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { CheckboxField, DateField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardTabs, type WizardTab } from "@/components/form/wizard"
import { createI18nHelpers } from "@/components/internationalization/helpers"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { completeAnnouncementWizard } from "../actions"
import {
  getClassesForAnnouncement,
  updateAnnouncementTargeting,
} from "./actions"
import { createTargetingSchema, type TargetingFormData } from "./validation"

interface TargetingFormProps {
  announcementId: string
  initialData?: Partial<TargetingFormData>
  onValidChange?: (isValid: boolean) => void
  onTabChange?: (tabId: string) => void
}

export const TargetingForm = forwardRef<WizardFormRef, TargetingFormProps>(
  ({ announcementId, initialData, onValidChange, onTabChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const [classOptions, setClassOptions] = useState<
      { label: string; value: string }[]
    >([])
    const { dictionary } = useDictionary()
    const { locale } = useLocale()
    const wt = (dictionary?.school?.announcements as any)?.wizard?.targeting as
      | Record<string, string>
      | undefined
    const w = (dictionary?.school?.announcements as any)?.wizard as
      | Record<string, any>
      | undefined

    const SCOPE_OPTIONS = [
      { label: wt?.scopeSchool || "School", value: "school" },
      { label: wt?.scopeClass || "Class", value: "class" },
      { label: wt?.scopeRole || "Role", value: "role" },
    ]

    const ROLE_OPTIONS = [
      { label: wt?.roleAdmin || "Admin", value: "ADMIN" },
      { label: wt?.roleTeacher || "Teacher", value: "TEACHER" },
      { label: wt?.roleStudent || "Student", value: "STUDENT" },
      { label: wt?.roleGuardian || "Guardian", value: "GUARDIAN" },
      { label: wt?.roleStaff || "Staff", value: "STAFF" },
      { label: wt?.roleAccountant || "Accountant", value: "ACCOUNTANT" },
    ]

    const TABS: WizardTab[] = [
      { id: "audience", label: wt?.audience || "Audience" },
      { id: "publishing", label: wt?.publishing || "Publishing" },
    ]

    // Fetch class options on mount
    useEffect(() => {
      getClassesForAnnouncement().then(setClassOptions)
    }, [])

    const schema = React.useMemo(() => {
      const messages = dictionary?.messages
      if (!messages) return createTargetingSchema()
      return createTargetingSchema(createI18nHelpers(messages).validation)
    }, [dictionary])

    const form = useForm<TargetingFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        scope: initialData?.scope || "school",
        classId: initialData?.classId,
        role: initialData?.role,
        published: initialData?.published ?? false,
        scheduledFor: initialData?.scheduledFor,
        expiresAt: initialData?.expiresAt,
        pinned: initialData?.pinned ?? false,
        featured: initialData?.featured ?? false,
      },
    })

    // Watch scope to show/hide conditional fields
    const scope = form.watch("scope")

    // Notify parent of validity changes
    const classId = form.watch("classId")
    const role = form.watch("role")
    React.useEffect(() => {
      let isValid = true
      if (scope === "class" && !classId) isValid = false
      if (scope === "role" && !role) isValid = false
      onValidChange?.(isValid)
    }, [scope, classId, role, onValidChange])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const valid = await form.trigger()
              if (!valid) {
                reject(new Error("Validation failed"))
                return
              }
              const data = form.getValues()
              const result = await updateAnnouncementTargeting(
                announcementId,
                data
              )
              if (!result.success) {
                ErrorToast(
                  resolveActionError(result.error ?? "", dictionary) ||
                    w?.failedToSave
                )
                reject(new Error(result.error))
                return
              }

              // Final step: complete the wizard
              const completeResult =
                await completeAnnouncementWizard(announcementId)
              if (!completeResult.success) {
                ErrorToast(
                  resolveActionError(completeResult.error ?? "", dictionary) ||
                    w?.failedToComplete
                )
                reject(new Error(completeResult.error))
                return
              }

              router.push(`/${locale}/announcements`)
              resolve()
            } catch (err) {
              // Never surface a raw JS Error message — it is always English.
              ErrorToast(w?.failedToSave)
              reject(err)
            }
          })
        }),
    }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          <WizardTabs tabs={TABS} onTabChange={onTabChange}>
            {(activeTab) =>
              activeTab === "audience" ? (
                <div className="space-y-6">
                  <SelectField
                    name="scope"
                    label={wt?.scopeLabel || "Scope"}
                    options={[...SCOPE_OPTIONS]}
                    required
                    disabled={isPending}
                  />
                  {scope === "class" && (
                    <SelectField
                      name="classId"
                      label={wt?.classLabel || "Class"}
                      options={[...classOptions]}
                      required
                      disabled={isPending}
                    />
                  )}
                  {scope === "role" && (
                    <SelectField
                      name="role"
                      label={wt?.roleLabel || "Role"}
                      options={[...ROLE_OPTIONS]}
                      required
                      disabled={isPending}
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <CheckboxField
                    name="published"
                    label={wt?.publishedLabel || "Published"}
                    disabled={isPending}
                  />
                  <DateField
                    name="scheduledFor"
                    label={wt?.scheduledForLabel || "Scheduled For"}
                    disabled={isPending}
                  />
                  <DateField
                    name="expiresAt"
                    label={wt?.expiresAtLabel || "Expires At"}
                    disabled={isPending}
                  />
                  <CheckboxField
                    name="pinned"
                    label={wt?.pinnedLabel || "Pinned"}
                    disabled={isPending}
                  />
                  <CheckboxField
                    name="featured"
                    label={wt?.featuredLabel || "Featured"}
                    disabled={isPending}
                  />
                </div>
              )
            }
          </WizardTabs>
        </form>
      </Form>
    )
  }
)

TargetingForm.displayName = "TargetingForm"
