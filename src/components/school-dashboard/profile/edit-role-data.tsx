"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { WizardFormRef } from "@/components/form/wizard/config"

import { getOwnEntity } from "./edit-role-actions"

type EntityType = "teacher" | "student"

// Map step name -> lazy import of the form component
const TEACHER_STEP_FORMS: Record<
  string,
  {
    label: string
    load: () => Promise<{
      default?: React.ComponentType<any>
      ContactForm?: React.ForwardRefExoticComponent<any>
      QualificationsForm?: React.ForwardRefExoticComponent<any>
      ExperienceForm?: React.ForwardRefExoticComponent<any>
    }>
  }
> = {
  contact: {
    label: "Contact Information",
    load: () =>
      import("@/components/school-dashboard/listings/teachers/wizard/contact/form"),
  },
  qualifications: {
    label: "Qualifications",
    load: () =>
      import("@/components/school-dashboard/listings/teachers/wizard/qualifications/form"),
  },
  experience: {
    label: "Experience",
    load: () =>
      import("@/components/school-dashboard/listings/teachers/wizard/experience/form"),
  },
}

const STUDENT_STEP_FORMS: Record<
  string,
  {
    label: string
    load: () => Promise<{
      default?: React.ComponentType<any>
      ContactForm?: React.ForwardRefExoticComponent<any>
    }>
  }
> = {
  contact: {
    label: "Contact & Emergency",
    load: () =>
      import("@/components/school-dashboard/listings/students/wizard/contact/form"),
  },
}

const STEP_FORMS = {
  teacher: TEACHER_STEP_FORMS,
  student: STUDENT_STEP_FORMS,
}

interface ProfileEditSectionProps {
  entityType: EntityType
  steps: string[]
}

export function ProfileEditSection({
  entityType,
  steps,
}: ProfileEditSectionProps) {
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [entityId, setEntityId] = useState<string | null>(null)
  const [entityData, setEntityData] = useState<Record<string, unknown> | null>(
    null
  )
  const [FormComponent, setFormComponent] =
    useState<React.ForwardRefExoticComponent<any> | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<WizardFormRef>(null)

  // Load entity data on mount
  useEffect(() => {
    startTransition(async () => {
      const result = await getOwnEntity(entityType)
      if (result.success && result.data) {
        setEntityId(result.data.entityId)
        setEntityData(result.data.data)
      }
    })
  }, [entityType])

  // Load the form component when a step is selected
  const openStep = useCallback(
    async (step: string) => {
      const forms = STEP_FORMS[entityType]
      const config = forms[step]
      if (!config) return

      const module = await config.load()
      // Find the exported form component (named export or default)
      const Form =
        (module as any).ContactForm ||
        (module as any).QualificationsForm ||
        (module as any).ExperienceForm ||
        module.default

      if (Form) {
        setFormComponent(() => Form)
        setActiveStep(step)
      }
    },
    [entityType]
  )

  const handleSave = useCallback(async () => {
    if (formRef.current) {
      await formRef.current.saveAndNext()
      setActiveStep(null)
      // Refresh entity data
      const result = await getOwnEntity(entityType)
      if (result.success && result.data) {
        setEntityData(result.data.data)
      }
    }
  }, [entityType])

  if (!entityId) return null

  const forms = STEP_FORMS[entityType]

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => {
          const config = forms[step]
          if (!config) return null
          return (
            <Button
              key={step}
              variant="outline"
              size="sm"
              onClick={() => openStep(step)}
              disabled={isPending}
            >
              <Pencil className="me-2 h-3 w-3" />
              {config.label}
            </Button>
          )
        })}
      </div>

      <Dialog open={!!activeStep} onOpenChange={() => setActiveStep(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{activeStep && forms[activeStep]?.label}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {FormComponent && entityId && (
              <FormComponent
                ref={formRef}
                {...(entityType === "teacher"
                  ? { teacherId: entityId }
                  : { studentId: entityId })}
                initialData={entityData || undefined}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActiveStep(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
