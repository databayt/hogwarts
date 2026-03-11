"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, GraduationCap, Layers, School } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useForm } from "react-hook-form"

import { cn } from "@/lib/utils"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { updateSchoolDescription } from "./actions"
import { descriptionSchema, type DescriptionFormData } from "./validation"

type Step = "type" | "level"

interface DescriptionFormProps {
  schoolId: string
  initialData?: Partial<DescriptionFormData>
  onSuccess?: () => void
  onStepChange?: (step: Step) => void
  dictionary?: any
}

const slideVariants = {
  enter: (d: number) => ({ x: d * 20, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -20, opacity: 0 }),
}

export function DescriptionForm({
  schoolId,
  initialData,
  onSuccess,
  onStepChange,
  dictionary,
}: DescriptionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")
  const [step, setStep] = useState<Step>(() => {
    if (
      initialData?.schoolType &&
      initialData?.schoolLevel &&
      initialData.schoolType !== "technical"
    ) {
      return "level"
    }
    return "type"
  })
  const [direction, setDirection] = useState(1)
  const dict = dictionary?.onboarding || {}

  const form = useForm<DescriptionFormData>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: {
      schoolType: initialData?.schoolType || undefined,
      schoolLevel: initialData?.schoolLevel || undefined,
    },
  })

  const handleSubmit = (data: DescriptionFormData) => {
    startTransition(async () => {
      try {
        setError("")
        const result = await updateSchoolDescription(schoolId, data)

        if (result.success) {
          onSuccess?.()
        } else {
          setError(result.error || "Failed to update school description")
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, message]) => {
              form.setError(field as keyof DescriptionFormData, { message })
            })
          }
        }
      } catch (err) {
        setError("An unexpected error occurred")
      }
    })
  }

  const schoolTypes = [
    {
      id: "private",
      title: dict.privateSchool || "Private",
      image: "/onboarding/private.png",
    },
    {
      id: "public",
      title: dict.publicSchool || "Public",
      image: "/onboarding/public.png",
    },
    {
      id: "international",
      title: dict.internationalSchool || "International",
      image: "/onboarding/international.png",
    },
    {
      id: "technical",
      title: dict.technicalSchool || "Technical",
      image: "/onboarding/techincal.png",
    },
    {
      id: "special",
      title: dict.specialSchool || "Special",
      image: "/onboarding/espical.png",
    },
  ]

  const schoolLevels = [
    {
      id: "primary" as const,
      title: dict.primaryLevel || "Primary",
      subtitle: dict.primaryGrades || "Grades 1-6",
      icon: School,
    },
    {
      id: "secondary" as const,
      title: dict.secondaryLevel || "Secondary",
      subtitle: dict.secondaryGrades || "Grades 7-12",
      icon: GraduationCap,
    },
    {
      id: "both" as const,
      title: dict.bothLevels || "Both",
      subtitle: dict.bothGrades || "Grades 1-12",
      icon: Layers,
    },
  ]

  const handleTypeTransition = (typeId: string) => {
    if (typeId === "technical") {
      form.setValue("schoolLevel", "secondary")
      setTimeout(() => form.handleSubmit(handleSubmit)(), 100)
    } else {
      setDirection(1)
      setStep("level")
      onStepChange?.("level")
    }
  }

  const handleBack = () => {
    setDirection(-1)
    setStep("type")
    onStepChange?.("type")
    form.setValue("schoolLevel", undefined as unknown as "primary")
  }

  const selectedTypeName =
    schoolTypes.find((t) => t.id === form.watch("schoolType"))?.title || ""

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {error && (
          <div className="text-destructive bg-destructive/10 mb-4 rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {step === "type" ? (
            <motion.div
              key="type"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <FormField
                control={form.control}
                name="schoolType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value)
                          handleTypeTransition(value)
                        }}
                        value={field.value}
                        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                      >
                        {schoolTypes.map((type) => (
                          <div key={type.id}>
                            <RadioGroupItem
                              value={type.id}
                              id={type.id}
                              className="sr-only"
                            />
                            <label
                              htmlFor={type.id}
                              onClick={() => {
                                if (field.value === type.id) {
                                  handleTypeTransition(type.id)
                                }
                              }}
                              className={cn(
                                "hover:border-foreground/50 flex h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border p-4 text-center transition-all",
                                field.value === type.id
                                  ? "border-foreground bg-accent"
                                  : "border-border"
                              )}
                            >
                              <Image
                                src={type.image}
                                alt={type.title}
                                width={40}
                                height={40}
                                className="mb-3"
                              />
                              <div className="font-medium">{type.title}</div>
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          ) : (
            <motion.div
              key="level"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <button
                type="button"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2 text-sm transition-colors"
              >
                <ArrowLeft size={16} />
                <span>{selectedTypeName}</span>
              </button>

              <FormField
                control={form.control}
                name="schoolLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value)
                          setTimeout(() => {
                            form.handleSubmit(handleSubmit)()
                          }, 100)
                        }}
                        value={field.value}
                        className="grid grid-cols-3 gap-3"
                      >
                        {schoolLevels.map((level) => (
                          <div key={level.id}>
                            <RadioGroupItem
                              value={level.id}
                              id={`level-${level.id}`}
                              className="sr-only"
                            />
                            <label
                              htmlFor={`level-${level.id}`}
                              className={cn(
                                "hover:border-foreground/50 flex h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border p-4 text-center transition-all",
                                field.value === level.id
                                  ? "border-foreground bg-accent"
                                  : "border-border"
                              )}
                            >
                              <level.icon size={24} className="mb-3" />
                              <div className="font-medium">{level.title}</div>
                              <div className="text-muted-foreground mt-1 text-xs">
                                {level.subtitle}
                              </div>
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </Form>
  )
}
