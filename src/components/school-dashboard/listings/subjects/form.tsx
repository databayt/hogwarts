"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
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
  const [showProposal, setShowProposal] = useState(false)

  const form = useForm<z.infer<typeof subjectCreateSchema>>({
    resolver: zodResolver(subjectCreateSchema),
    defaultValues: {
      subjectName: "",
      departmentId: "",
      catalogSubjectId: "",
      lang: "ar",
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
      const s = res.data as any
      form.reset({
        subjectName: s.subjectName ?? "",
        departmentId: s.departmentId ?? "",
        catalogSubjectId: s.catalogSubjectId ?? "",
      })
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  // When a catalog subject is selected, auto-fill the name
  const handleCatalogSelect = (catalogId: string) => {
    const selected = catalogOptions.find((c) => c.id === catalogId)
    if (selected) {
      form.setValue("catalogSubjectId", catalogId)
      form.setValue("subjectName", selected.name)
    }
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
            : t?.success?.subjectCreated || "Subject created"
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
              : t?.error?.subjectCreateFailed || "Failed to create subject")
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
      const step1Fields = ["subjectName", "departmentId"] as const
      const step1Valid = await form.trigger(step1Fields)
      if (step1Valid) {
        await form.handleSubmit(onSubmit)()
      }
    }
  }

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      const currentStepFields = ["subjectName", "departmentId"] as const
      const stepValid = await form.trigger(currentStepFields)
      if (stepValid) {
        await form.handleSubmit(onSubmit)()
      }
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
                  Link to Catalog Subject (optional)
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
                  <option value="">-- Manual entry (no catalog link) --</option>
                  {catalogOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.department})
                    </option>
                  ))}
                </select>
                <p className="text-muted-foreground text-xs">
                  Linking to the catalog enables LMS content, chapters, and
                  lessons.
                </p>
              </div>
            )}

            <InformationStep form={form} isView={isView} />

            {/* Propose New button */}
            {!currentId && !isView && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground mb-2 text-xs">
                  Can&apos;t find your subject in the catalog?
                </p>
                {/* TODO: Implement proposal UI (ProposeSubjectDialog) */}
                <Button type="button" variant="outline" size="sm" disabled>
                  Propose New Subject to Catalog (Coming Soon)
                </Button>
              </div>
            )}
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
            isView
              ? "View Subject"
              : currentId
                ? "Edit Subject"
                : "Create Subject"
          }
          description={
            isView
              ? "View subject details"
              : currentId
                ? "Update subject details"
                : "Add a new subject to your school"
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
