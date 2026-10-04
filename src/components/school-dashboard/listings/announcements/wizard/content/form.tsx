"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { resolveActionError } from "@/lib/resolve-action-error"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, SelectField, TextareaField } from "@/components/form"
import { useWizardValidationOptional } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
import { createI18nHelpers } from "@/components/internationalization/helpers"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { useAnnouncementScopeOptions } from "../../use-scope-options"
import { completeAnnouncementWizard } from "../actions"
import { updateAnnouncementContent } from "./actions"
import { createContentSchema, type ContentFormData } from "./validation"

interface ContentFormProps {
  /** Omitted when creating: the row does not exist until submit. */
  announcementId?: string
  initialData?: Partial<ContentFormData>
  onValidChange?: (isValid: boolean) => void
  /**
   * Override the save pipeline. The routed wizard leaves this unset and keeps
   * its update-then-complete pair; the modal passes a single-round-trip submit.
   */
  onSubmit?: (data: ContentFormData) => Promise<void>
}

export const ContentForm = forwardRef<WizardFormRef, ContentFormProps>(
  ({ announcementId, initialData, onValidChange, onSubmit }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { dictionary } = useDictionary()
    const { locale } = useLocale()
    const isAr = locale === "ar"

    const wc = (dictionary?.school?.announcements as any)?.wizard?.content as
      | Record<string, string>
      | undefined
    const wt = (dictionary?.school?.announcements as any)?.wizard?.targeting as
      | Record<string, string>
      | undefined
    const w = (dictionary?.school?.announcements as any)?.wizard as
      | Record<string, any>
      | undefined

    const PRIORITY_OPTIONS = [
      { label: w?.priorityLow || (isAr ? "منخفضة" : "Low"), value: "low" },
      {
        label: w?.priorityNormal || (isAr ? "عادية" : "Normal"),
        value: "normal",
      },
      { label: w?.priorityHigh || (isAr ? "عالية" : "High"), value: "high" },
      {
        label: w?.priorityUrgent || (isAr ? "عاجلة" : "Urgent"),
        value: "urgent",
      },
    ]

    const SCOPE_OPTIONS = [
      {
        label: wt?.scopeSchool || (isAr ? "المدرسة" : "School"),
        value: "school",
      },
      { label: wt?.scopeGrade || (isAr ? "الصف" : "Grade"), value: "grade" },
      {
        label: wt?.scopeSection || (isAr ? "الفصل" : "Section"),
        value: "section",
      },
      { label: wt?.scopeRole || (isAr ? "الدور" : "Role"), value: "role" },
    ]

    const ROLE_OPTIONS = [
      { label: wt?.roleAdmin || (isAr ? "مسؤول" : "Admin"), value: "ADMIN" },
      {
        label: wt?.roleTeacher || (isAr ? "معلم" : "Teacher"),
        value: "TEACHER",
      },
      {
        label: wt?.roleStudent || (isAr ? "طالب" : "Student"),
        value: "STUDENT",
      },
      {
        label: wt?.roleGuardian || (isAr ? "ولي أمر" : "Guardian"),
        value: "GUARDIAN",
      },
      { label: wt?.roleStaff || (isAr ? "موظف" : "Staff"), value: "STAFF" },
      {
        label: wt?.roleAccountant || (isAr ? "محاسب" : "Accountant"),
        value: "ACCOUNTANT",
      },
    ]

    const schema = React.useMemo(() => {
      const messages = dictionary?.messages
      if (!messages) return createContentSchema()
      return createContentSchema(createI18nHelpers(messages).validation)
    }, [dictionary])

    const form = useForm<ContentFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        title: initialData?.title || "",
        body: initialData?.body || "",
        lang: initialData?.lang || "ar",
        priority: initialData?.priority || "normal",
        scope: initialData?.scope || "school",
        gradeId: initialData?.gradeId,
        sectionId: initialData?.sectionId,
        role: initialData?.role,
      },
    })

    const title = form.watch("title") || ""
    const body = form.watch("body") || ""
    const priority = form.watch("priority")
    const scope = form.watch("scope")
    const gradeId = form.watch("gradeId")
    const sectionId = form.watch("sectionId")
    const role = form.watch("role")

    // School-wide is the common case: grades and sections load only once a
    // grade or section announcement is being written
    const { gradeOptions, sectionOptions } = useAnnouncementScopeOptions(
      scope === "grade" || scope === "section"
    )

    const validationContext = useWizardValidationOptional()
    const setFieldProgress = validationContext?.setFieldProgress

    React.useEffect(() => {
      let isValid = title.trim().length >= 1 && body.trim().length >= 1
      if (scope === "grade" && !gradeId) isValid = false
      if (scope === "section" && !sectionId) isValid = false
      if (scope === "role" && !role) isValid = false
      onValidChange?.(isValid)

      // Calculate per-field completion progress for footer step progress bar
      let completedFields = 0
      const totalFields = 4 // title, body, priority, scope
      if (title.trim().length >= 1) completedFields++
      if (body.trim().length >= 1) completedFields++
      if (priority) completedFields++
      if (scope === "grade") {
        if (gradeId) completedFields++
      } else if (scope === "section") {
        if (sectionId) completedFields++
      } else if (scope === "role") {
        if (role) completedFields++
      } else if (scope) {
        completedFields++
      }

      const progressPercent = Math.round((completedFields / totalFields) * 100)
      setFieldProgress?.(progressPercent)
    }, [
      title,
      body,
      priority,
      scope,
      gradeId,
      sectionId,
      role,
      onValidChange,
      setFieldProgress,
    ])

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

              // Modal mode: one round-trip that creates-or-updates and
              // completes. Errors are surfaced by the caller.
              if (onSubmit) {
                await onSubmit(data)
                resolve()
                return
              }

              if (!announcementId) {
                reject(new Error("Missing announcement id"))
                return
              }

              const result = await updateAnnouncementContent(
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

              resolve()
            } catch (err) {
              // Never surface a raw JS Error message — it is always English.
              // In modal mode the caller has already reported the failure.
              if (!onSubmit) ErrorToast(w?.failedToSave)
              reject(err)
            }
          })
        }),
    }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          <InputField
            name="title"
            label={wc?.titleLabel || (isAr ? "العنوان" : "Title")}
            placeholder={
              wc?.titlePlaceholder ||
              (isAr ? "أدخل عنوان الإعلان" : "Enter announcement title")
            }
            required
            disabled={isPending}
          />

          <TextareaField
            name="body"
            label={wc?.bodyLabel || (isAr ? "المحتوى" : "Body")}
            placeholder={
              wc?.bodyPlaceholder ||
              (isAr ? "أدخل نص الإعلان" : "Enter announcement body")
            }
            required
            disabled={isPending}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              name="priority"
              label={wc?.priorityLabel || (isAr ? "الأولوية" : "Priority")}
              options={[...PRIORITY_OPTIONS]}
              disabled={isPending}
            />

            <SelectField
              name="scope"
              label={wt?.scopeLabel || (isAr ? "النطاق" : "Scope")}
              options={[...SCOPE_OPTIONS]}
              required
              disabled={isPending}
            />
          </div>

          {scope === "grade" && (
            <SelectField
              name="gradeId"
              label={wt?.gradeLabel || (isAr ? "الصف" : "Grade")}
              options={gradeOptions}
              required
              disabled={isPending}
            />
          )}

          {scope === "section" && (
            <SelectField
              name="sectionId"
              label={wt?.sectionLabel || (isAr ? "الفصل" : "Section")}
              options={sectionOptions}
              required
              disabled={isPending}
            />
          )}

          {scope === "role" && (
            <SelectField
              name="role"
              label={wt?.roleLabel || (isAr ? "الدور" : "Role")}
              options={[...ROLE_OPTIONS]}
              required
              disabled={isPending}
            />
          )}
        </form>
      </Form>
    )
  }
)

ContentForm.displayName = "ContentForm"
