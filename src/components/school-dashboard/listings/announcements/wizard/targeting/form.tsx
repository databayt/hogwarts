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

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { CheckboxField, DateField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardTabs, type WizardTab } from "@/components/form/wizard"

import { completeAnnouncementWizard } from "../actions"
import {
  getClassesForAnnouncement,
  updateAnnouncementTargeting,
} from "./actions"
import { targetingSchema, type TargetingFormData } from "./validation"

const SCOPE_OPTIONS = [
  { label: "School", value: "school" },
  { label: "Class", value: "class" },
  { label: "Role", value: "role" },
]

const ROLE_OPTIONS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Teacher", value: "TEACHER" },
  { label: "Student", value: "STUDENT" },
  { label: "Guardian", value: "GUARDIAN" },
  { label: "Staff", value: "STAFF" },
  { label: "Accountant", value: "ACCOUNTANT" },
]

const TABS: WizardTab[] = [
  { id: "audience", label: "Audience" },
  { id: "publishing", label: "Publishing" },
]

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

    // Fetch class options on mount
    useEffect(() => {
      getClassesForAnnouncement().then(setClassOptions)
    }, [])

    const form = useForm<TargetingFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(targetingSchema) as any,
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
                ErrorToast(result.error || "Failed to save")
                reject(new Error(result.error))
                return
              }

              // Final step: complete the wizard
              const completeResult =
                await completeAnnouncementWizard(announcementId)
              if (!completeResult.success) {
                ErrorToast(completeResult.error || "Failed to complete")
                reject(new Error(completeResult.error))
                return
              }

              router.push("/announcements")
              resolve()
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Failed to save"
              ErrorToast(msg)
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
                    label="Scope"
                    options={[...SCOPE_OPTIONS]}
                    required
                    disabled={isPending}
                  />
                  {scope === "class" && (
                    <SelectField
                      name="classId"
                      label="Class"
                      options={[...classOptions]}
                      required
                      disabled={isPending}
                    />
                  )}
                  {scope === "role" && (
                    <SelectField
                      name="role"
                      label="Role"
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
                    label="Published"
                    disabled={isPending}
                  />
                  <DateField
                    name="scheduledFor"
                    label="Scheduled For"
                    disabled={isPending}
                  />
                  <DateField
                    name="expiresAt"
                    label="Expires At"
                    disabled={isPending}
                  />
                  <CheckboxField
                    name="pinned"
                    label="Pinned"
                    disabled={isPending}
                  />
                  <CheckboxField
                    name="featured"
                    label="Featured"
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
