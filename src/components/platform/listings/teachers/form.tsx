"use client"

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
import {
  createTeacher,
  getTeacher,
  updateTeacher,
} from "@/components/platform/listings/teachers/actions"
import { teacherCreateSchema } from "@/components/platform/listings/teachers/validation"

import { STEP_FIELDS, STEPS, TOTAL_FIELDS } from "./config"
import { ContactStep } from "./contact"
import { EmploymentDetailsStep } from "./employment"
import { ExperienceStep } from "./experience"
import { SubjectExpertiseStep } from "./expertise"
import { InformationStep } from "./information"
import { QualificationsStep } from "./qualifications"
import { ReviewStep } from "./review"

interface TeacherCreateFormProps {
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void
}

export function TeacherCreateForm({ onSuccess }: TeacherCreateFormProps) {
  const { modal, closeModal } = useModal()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const form = useForm<z.infer<typeof teacherCreateSchema>>({
    resolver: zodResolver(teacherCreateSchema) as any,
    defaultValues: {
      givenName: "",
      surname: "",
      gender: undefined as unknown as "male" | "female" | undefined,
      emailAddress: "",
      // Employment details
      employeeId: "",
      joiningDate: undefined,
      employmentStatus: "ACTIVE",
      employmentType: "FULL_TIME",
      contractStartDate: undefined,
      contractEndDate: undefined,
      // Arrays for future steps
      phoneNumbers: [],
      qualifications: [],
      experiences: [],
      subjectExpertise: [],
    },
  })

  const isView = !!(modal.id && modal.id.startsWith("view:"))
  const currentId = modal.id
    ? modal.id.startsWith("view:")
      ? modal.id.split(":")[1]
      : modal.id
    : undefined

  useEffect(() => {
    const load = async () => {
      if (!currentId) return
      const res = await getTeacher({ id: currentId })
      if (!res.success || !res.data) return
      const t = res.data as any
      form.reset({
        givenName: t.givenName ?? "",
        surname: t.surname ?? "",
        gender:
          ((t.gender ?? "") as string).toLowerCase() === "female"
            ? "female"
            : "male",
        emailAddress: t.emailAddress ?? "",
        // Employment details
        employeeId: t.employeeId ?? "",
        joiningDate: t.joiningDate ? new Date(t.joiningDate) : undefined,
        employmentStatus: t.employmentStatus ?? "ACTIVE",
        employmentType: t.employmentType ?? "FULL_TIME",
        contractStartDate: t.contractStartDate
          ? new Date(t.contractStartDate)
          : undefined,
        contractEndDate: t.contractEndDate
          ? new Date(t.contractEndDate)
          : undefined,
      })
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  async function onSubmit(values: z.infer<typeof teacherCreateSchema>) {
    try {
      const res = currentId
        ? await updateTeacher({ id: currentId, ...values })
        : await createTeacher(values)
      if (res?.success) {
        toast.success(currentId ? "Teacher updated" : "Teacher created")
        closeModal()
        // Use callback for optimistic update, fallback to router.refresh()
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      } else {
        toast.error(
          res?.error ||
            (currentId
              ? "Failed to update teacher"
              : "Failed to create teacher")
        )
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = [
        "givenName",
        "surname",
        "gender",
        "birthDate",
      ] as const
      const step1Valid = await form.trigger(step1Fields)
      if (step1Valid) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      const step2Fields = ["emailAddress"] as const
      const step2Valid = await form.trigger(step2Fields)
      if (step2Valid) {
        setCurrentStep(3)
      }
    } else if (currentStep === 3) {
      // Employment fields are optional, just move to next step
      setCurrentStep(4)
    } else if (currentStep === 4) {
      // Qualifications are optional, move to next
      setCurrentStep(5)
    } else if (currentStep === 5) {
      // Experience is optional, move to next
      setCurrentStep(6)
    } else if (currentStep === 6) {
      // Subject expertise is optional, move to review
      setCurrentStep(7)
    } else if (currentStep === 7) {
      // Submit from review step
      await form.handleSubmit(onSubmit)()
    }
  }

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      // For editing, save current step data
      const currentStepFields =
        currentStep === 1
          ? (["givenName", "surname", "gender", "birthDate"] as const)
          : currentStep === 2
            ? (["emailAddress"] as const)
            : ([
                "employeeId",
                "joiningDate",
                "employmentStatus",
                "employmentType",
                "contractStartDate",
                "contractEndDate",
              ] as const)

      const stepValid = await form.trigger(currentStepFields)
      if (stepValid) {
        await form.handleSubmit(onSubmit)()
      }
    } else {
      // For creating, just go to next step
      await handleNext()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      closeModal()
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <InformationStep form={form} isView={isView} />
      case 2:
        return <ContactStep form={form} isView={isView} />
      case 3:
        return <EmploymentDetailsStep form={form} isView={isView} />
      case 4:
        return <QualificationsStep form={form} isView={isView} />
      case 5:
        return <ExperienceStep form={form} isView={isView} />
      case 6:
        return <SubjectExpertiseStep form={form} isView={isView} />
      case 7:
        return <ReviewStep form={form} isView={isView} />
      default:
        return null
    }
  }

  // Calculate progress based on filled fields
  const values = form.watch()
  const getFilledFieldsCount = () => {
    const allFields = [...STEP_FIELDS[1], ...STEP_FIELDS[2], ...STEP_FIELDS[3]]
    const filledCount = allFields.filter((field) => {
      const value = values[field as keyof typeof values]
      return value !== undefined && value !== "" && value !== null
    }).length
    return filledCount
  }
  const progressPercentage = (getFilledFieldsCount() / TOTAL_FIELDS) * 100

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={
            isView
              ? "View Teacher"
              : currentId
                ? "Edit Teacher"
                : "Create Teacher"
          }
          description={
            isView
              ? "View teacher details"
              : currentId
                ? "Update teacher details"
                : "Add a new teacher to your school"
          }
        >
          {renderCurrentStep()}
        </ModalFormLayout>

        <ModalFooter
          currentStep={currentStep}
          totalSteps={7}
          stepLabel={STEPS[currentStep as keyof typeof STEPS]}
          isView={isView}
          isEdit={!!currentId}
          isDirty={form.formState.isDirty}
          progress={progressPercentage}
          onBack={handleBack}
          onNext={handleNext}
          onSaveStep={handleSaveCurrentStep}
        />
      </form>
    </Form>
  )
}

export default TeacherCreateForm
