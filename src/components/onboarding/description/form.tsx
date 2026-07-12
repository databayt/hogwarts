"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Layers,
  School,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useForm } from "react-hook-form"

import { asset } from "@/lib/asset-url"
import { cn } from "@/lib/utils"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { createI18nHelpers } from "@/components/internationalization/helpers"

import { updateSchoolDescription } from "./actions"
import { createDescriptionSchema, type DescriptionFormData } from "./validation"

type Step = "type" | "level"

interface DescriptionFormProps {
  schoolId: string
  initialData?: Partial<DescriptionFormData>
  onSuccess?: () => void
  onStepChange?: (step: Step) => void
  dictionary?: Dictionary
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
  const dict = ((dictionary?.school as Record<string, unknown> | undefined)
    ?.onboarding ?? {}) as Record<string, string>

  const { v, e } = useMemo(() => {
    if (!dictionary?.messages) return { v: undefined, e: undefined }
    const { validation, error } = createI18nHelpers(dictionary.messages)
    return { v: validation, e: error }
  }, [dictionary])

  const schema = useMemo(() => createDescriptionSchema(v), [v])

  const form = useForm<DescriptionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      schoolType: initialData?.schoolType,
      schoolLevel: initialData?.schoolLevel,
    },
  })

  const ERROR_MAP: Record<string, string> = useMemo(
    () => ({
      VALIDATION_ERROR: v?.get("invalidSelection") ?? "Invalid selection",
      SCHOOL_NOT_FOUND: e?.tenant.schoolNotFound() ?? "School not found",
    }),
    [v, e]
  )

  const handleSubmit = (data: DescriptionFormData) => {
    startTransition(async () => {
      try {
        setError("")
        const result = await updateSchoolDescription(schoolId, data)

        if (result.success) {
          onSuccess?.()
        } else {
          const translated =
            (result.code && ERROR_MAP[result.code]) ??
            e?.server.internalError() ??
            dict.unexpectedError ??
            "An error occurred"
          setError(translated)
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, message]) => {
              form.setError(field as keyof DescriptionFormData, { message })
            })
          }
        }
      } catch {
        setError(e?.server.internalError() ?? dict.unexpectedError ?? "")
      }
    })
  }

  const schoolTypes = [
    {
      id: "private" as const,
      title: dict.privateSchool,
      image: asset("/illustrations/private.png"),
    },
    {
      id: "public" as const,
      title: dict.publicSchool,
      image: asset("/illustrations/public.png"),
    },
    {
      id: "international" as const,
      title: dict.internationalSchool,
      image: asset("/illustrations/international.png"),
    },
    {
      id: "technical" as const,
      title: dict.technicalSchool,
      image: asset("/illustrations/techincal.png"),
    },
    {
      id: "special" as const,
      title: dict.specialSchool,
      image: asset("/illustrations/espical.png"),
    },
  ]

  const schoolLevels = [
    {
      id: "primary" as const,
      title: dict.primaryLevel,
      subtitle: dict.primaryGrades,
      icon: School,
    },
    {
      id: "middle" as const,
      title: dict.middleLevel,
      subtitle: dict.middleGrades,
      icon: BookOpen,
    },
    {
      id: "secondary" as const,
      title: dict.secondaryLevel,
      subtitle: dict.secondaryGrades,
      icon: GraduationCap,
    },
    {
      id: "both" as const,
      title: dict.bothLevels,
      subtitle: dict.bothGrades,
      icon: Layers,
    },
  ]

  const handleTypeTransition = (typeId: DescriptionFormData["schoolType"]) => {
    // Technical schools are secondary-only by definition; skip the level step
    // and auto-submit so fee-provisioning downstream sees a complete profile.
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
    form.setValue("schoolLevel", undefined)
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
                          const typed =
                            value as DescriptionFormData["schoolType"]
                          field.onChange(typed)
                          handleTypeTransition(typed)
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
                disabled={isPending}
              >
                <ArrowLeft size={16} className="rtl:rotate-180" />
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
                          const typed =
                            value as DescriptionFormData["schoolLevel"]
                          field.onChange(typed)
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
