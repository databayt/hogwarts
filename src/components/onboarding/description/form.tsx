"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  BookOpen,
  Building2,
  GraduationCap,
  Heart,
  Landmark,
  Library,
  Loader2,
  School,
  Wrench,
} from "lucide-react"
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

interface DescriptionFormProps {
  schoolId: string
  initialData?: Partial<DescriptionFormData>
  onSuccess?: () => void
  onTypeSelect?: (type: string) => void
  dictionary?: any
}

export function DescriptionForm({
  schoolId,
  initialData,
  onSuccess,
  onTypeSelect,
  dictionary,
}: DescriptionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")
  const dict = dictionary?.onboarding || {}

  const form = useForm<DescriptionFormData>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: {
      schoolType: initialData?.schoolType || "private",
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
      icon: Building2,
    },
    {
      id: "public",
      title: dict.publicSchool || "Public",
      icon: School,
    },
    {
      id: "international",
      title: dict.internationalSchool || "International",
      icon: Landmark,
    },
    {
      id: "technical",
      title: dict.technicalSchool || "Technical",
      icon: Wrench,
    },
    {
      id: "special",
      title: dict.specialSchool || "Special",
      icon: Heart,
    },
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {error && (
          <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        {/* School Type Selection */}
        <FormField
          control={form.control}
          name="schoolType"
          render={({ field }) => (
            <FormItem>
              <div className="space-y-4">
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Immediately notify parent component
                      onTypeSelect?.(value)
                      console.log("📝 School type selected:", value)
                      // Auto-submit the form when school type is selected
                      setTimeout(() => {
                        form.handleSubmit(handleSubmit)()
                      }, 100)
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
                          className={cn(
                            "hover:border-foreground/50 flex h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border p-4 text-center transition-all",
                            field.value === type.id
                              ? "border-foreground bg-accent"
                              : "border-border"
                          )}
                        >
                          <type.icon size={24} className="mb-3" />
                          <div className="font-medium">{type.title}</div>
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
