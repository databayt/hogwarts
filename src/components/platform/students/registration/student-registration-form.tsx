"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronLeft, ChevronRight, Save } from "lucide-react"
import { useForm } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"

import { registerStudent } from "../actions"
import { ContactInfoStep } from "./contact-info-step"
import { DocumentUploadStep } from "./document-upload-step"
import { EmergencyContactStep } from "./emergency-contact-step"
import { GuardianInfoStep } from "./guardian-info-step"
import { HealthInfoStep } from "./health-info-step"
// Import step components
import { PersonalInfoStep } from "./personal-info-step"
import { PreviousEducationStep } from "./previous-education-step"
import type { Student } from "./types"
// Import validation and types
import {
  registrationSteps,
  studentRegistrationSchema,
  validateStep,
  type StudentRegistration,
} from "./validation"

interface StudentRegistrationFormProps {
  student?: Student
  isEdit?: boolean
  onSuccess?: (student: Student) => void
  onCancel?: () => void
  dictionary?: any // TODO: Add proper dictionary type
}

const stepComponents = {
  personal: PersonalInfoStep,
  contact: ContactInfoStep,
  emergency: EmergencyContactStep,
  guardian: GuardianInfoStep,
  education: PreviousEducationStep,
  health: HealthInfoStep,
  documents: DocumentUploadStep,
}

export function StudentRegistrationForm({
  student,
  isEdit = false,
  onSuccess,
  onCancel,
  dictionary,
}: StudentRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<StudentRegistration>({
    resolver: zodResolver(studentRegistrationSchema) as any,
    defaultValues: (student as any) || {
      givenName: "",
      surname: "",
      gender: "Male",
      nationality: "Saudi Arabia",
      country: "Saudi Arabia",
      studentType: "REGULAR",
      status: "ACTIVE",
      enrollmentDate: new Date(),
      admissionDate: new Date(),
      sameAsPermanent: false,
      hasSpecialNeeds: false,
      guardians: [],
      documents: [],
      vaccinations: [],
    },
    mode: "onChange",
  })

  const currentStepConfig = registrationSteps[currentStep]
  const CurrentStepComponent =
    stepComponents[currentStepConfig.id as keyof typeof stepComponents]
  const totalSteps = registrationSteps.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  const validateCurrentStep = async () => {
    const stepFields = Object.keys(currentStepConfig.schema.shape)
    const result = await form.trigger(stepFields as any)

    if (result) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep))
    }

    return result
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = async (stepIndex: number) => {
    // Only allow navigation to completed steps or the next step
    if (stepIndex <= currentStep || completedSteps.has(stepIndex - 1)) {
      if (currentStep < stepIndex) {
        const isValid = await validateCurrentStep()
        if (!isValid) return
      }
      setCurrentStep(stepIndex)
    }
  }

  const handleSubmit = async (data: StudentRegistration) => {
    setIsSubmitting(true)
    try {
      const result = await registerStudent(data)

      if (result.success) {
        toast({
          title: isEdit ? "Student Updated" : "Student Registered",
          description: `${data.givenName} ${data.surname} has been successfully ${isEdit ? "updated" : "registered"}.`,
        })

        if (onSuccess && result.data) {
          onSuccess(result.data as Student)
        } else {
          router.push("/students")
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to register student",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveProgress = async () => {
    const data = form.getValues()
    // TODO: Implement save draft functionality
    toast({
      title: "Progress Saved",
      description: "Your progress has been saved. You can continue later.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="text-muted-foreground flex justify-between text-sm">
          <span>
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between">
        {registrationSteps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => handleStepClick(index)}
            disabled={index > currentStep && !completedSteps.has(index - 1)}
            className={cn(
              "flex flex-col items-center gap-2 px-2 py-1 transition-colors",
              index === currentStep && "text-primary",
              completedSteps.has(index) && "text-green-600",
              index > currentStep &&
                !completedSteps.has(index) &&
                "text-muted-foreground opacity-50"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                index === currentStep &&
                  "border-primary bg-primary text-primary-foreground",
                completedSteps.has(index) &&
                  "border-green-600 bg-green-600 text-white",
                index > currentStep &&
                  !completedSteps.has(index) &&
                  "border-muted-foreground"
              )}
            >
              {completedSteps.has(index) ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm">{index + 1}</span>
              )}
            </div>
            <span className="hidden text-xs sm:block">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{currentStepConfig.title}</CardTitle>
              <CardDescription>
                {isEdit ? "Update" : "Enter"} the student's{" "}
                {currentStepConfig.title.toLowerCase()}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <CurrentStepComponent form={form} dictionary={dictionary} />
            </CardContent>

            <CardFooter className="flex justify-between gap-2">
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                )}

                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveProgress}
                >
                  <Save className="mr-1 h-4 w-4" />
                  Save Progress
                </Button>

                {currentStep < totalSteps - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Submitting..."
                      : isEdit
                        ? "Update Student"
                        : "Register Student"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
