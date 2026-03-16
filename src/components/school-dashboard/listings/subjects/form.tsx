"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Form } from "@/components/ui/form"
import { useModal } from "@/components/atom/modal/context"
import { ModalFooter } from "@/components/atom/modal/modal-footer"
import { ModalFormLayout } from "@/components/atom/modal/modal-form-layout"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  createSubject,
  getCatalogSubjectsForPicker,
  getSubject,
  updateSubject,
} from "@/components/school-dashboard/listings/subjects/actions"
import { subjectCreateSchema } from "@/components/school-dashboard/listings/subjects/validation"

import { InformationStep } from "./information"

interface SubjectCreateFormProps {
  onSuccess?: () => void
}

type CatalogOption = {
  id: string
  name: string
  department: string
  slug: string
}

export function SubjectCreateForm({ onSuccess }: SubjectCreateFormProps) {
  const { dictionary: fullDict } = useDictionary()
  const t = fullDict?.messages?.toast
  const { modal, closeModal } = useModal()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [catalogOptions, setCatalogOptions] = useState<CatalogOption[]>([])

  const form = useForm<z.infer<typeof subjectCreateSchema>>({
    resolver: zodResolver(subjectCreateSchema),
    defaultValues: {
      catalogSubjectId: "",
      gradeId: "",
      streamId: undefined,
      customName: "",
      isRequired: true,
      weeklyPeriods: undefined,
    },
  })

  const isView = !!(modal.id && modal.id.startsWith("view:"))
  const currentId = modal.id
    ? modal.id.startsWith("view:")
      ? modal.id.split(":")[1]
      : modal.id
    : undefined

  // Load catalog subjects for the picker
  useEffect(() => {
    const loadCatalog = async () => {
      const res = await getCatalogSubjectsForPicker()
      if (res.success && res.data) {
        setCatalogOptions(res.data)
      }
    }
    loadCatalog()
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!currentId) return
      const res = await getSubject({ id: currentId })
      if (!res.success || !res.data) return
      const s = res.data
      form.reset({
        catalogSubjectId: s.id ?? "",
        gradeId: "",
        customName: "",
        isRequired: true,
      })
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  // When a catalog subject is selected, auto-fill catalogSubjectId
  const handleCatalogSelect = (catalogId: string) => {
    form.setValue("catalogSubjectId", catalogId)
  }

  async function onSubmit(values: z.infer<typeof subjectCreateSchema>) {
    try {
      const res = currentId
        ? await updateSubject({ id: currentId, ...values })
        : await createSubject(values)
      if (res?.success) {
        toast.success(
          currentId
            ? t?.success?.subjectUpdated || "Subject updated"
            : t?.success?.subjectCreated || "Subject added"
        )
        closeModal()
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      } else {
        toast.error(
          res?.error ||
            (currentId
              ? t?.error?.subjectUpdateFailed || "Failed to update subject"
              : t?.error?.subjectCreateFailed || "Failed to add subject")
        )
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error(
        fullDict?.common?.unexpectedError || "An unexpected error occurred"
      )
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ["catalogSubjectId", "gradeId"] as const
      const step1Valid = await form.trigger(step1Fields)
      if (step1Valid) {
        await form.handleSubmit(onSubmit)()
      }
    }
  }

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      await form.handleSubmit(onSubmit)()
    } else {
      await handleNext()
    }
  }

  const handleBack = () => {
    closeModal()
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Catalog subject picker */}
            {!currentId && catalogOptions.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select Subject from Catalog
                </label>
                <select
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  value={form.watch("catalogSubjectId") || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleCatalogSelect(e.target.value)
                    } else {
                      form.setValue("catalogSubjectId", "")
                    }
                  }}
                  disabled={isView}
                >
                  <option value="">-- Select a subject --</option>
                  {catalogOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.department})
                    </option>
                  ))}
                </select>
                <p className="text-muted-foreground text-xs">
                  Select a subject from the catalog to add to your school.
                </p>
              </div>
            )}

            <InformationStep form={form} isView={isView} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={
            isView ? "View Subject" : currentId ? "Edit Subject" : "Add Subject"
          }
          description={
            isView
              ? "View subject details"
              : currentId
                ? "Update subject settings"
                : "Select a subject from the catalog to add to your school"
          }
        >
          {renderCurrentStep()}
        </ModalFormLayout>

        <ModalFooter
          currentStep={currentStep}
          totalSteps={1}
          stepLabel="Subject Details"
          isView={isView}
          isEdit={!!currentId}
          isDirty={form.formState.isDirty}
          onBack={handleBack}
          onNext={handleNext}
          onSaveStep={handleSaveCurrentStep}
        />
      </form>
    </Form>
  )
}

export default SubjectCreateForm
