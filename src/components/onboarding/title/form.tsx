"use client"

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { generateSubdomain } from "@/lib/subdomain"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLocale } from "@/components/internationalization/use-locale"

import { FORM_LIMITS } from "../config.client"
import { updateSchoolTitle } from "./actions"
import { titleSchema, type TitleFormData } from "./validation"

interface TitleFormProps {
  schoolId: string
  initialData?: Partial<TitleFormData>
  onSuccess?: () => void
  onTitleChange?: (title: string) => void
  dictionary?: any
}

export interface TitleFormRef {
  saveAndNext: () => Promise<void>
}

export const TitleForm = forwardRef<TitleFormRef, TitleFormProps>(
  ({ schoolId, initialData, onSuccess, onTitleChange, dictionary }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string>("")
    const { isRTL } = useLocale()
    const dict = dictionary?.onboarding || {}

    const form = useForm<TitleFormData>({
      resolver: zodResolver(titleSchema),
      defaultValues: {
        title: initialData?.title || "",
        subdomain: initialData?.subdomain || "",
      },
    })

    const saveAndNext = async () => {
      const data = form.getValues()
      console.log("🎯 [TITLE FORM] saveAndNext called", {
        schoolId,
        data,
        timestamp: new Date().toISOString(),
      })

      return new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            setError("")
            console.log("📤 [TITLE FORM] Calling updateSchoolTitle", {
              schoolId,
              title: data.title,
              timestamp: new Date().toISOString(),
            })

            const result = await updateSchoolTitle(schoolId, data)

            console.log("📥 [TITLE FORM] updateSchoolTitle response", {
              success: result.success,
              error: result.error,
              data: result.data,
              timestamp: new Date().toISOString(),
            })

            if (result.success) {
              console.log(
                "✅ [TITLE FORM] Update successful, calling onSuccess callback"
              )
              onSuccess?.()
              resolve()
            } else {
              console.log("❌ [TITLE FORM] Update failed", {
                error: result.error,
                errors: result.errors,
              })
              setError(result.error || "Failed to update school name")
              if (result.errors) {
                Object.entries(result.errors).forEach(([field, message]) => {
                  form.setError(field as keyof TitleFormData, { message })
                })
              }
              reject(new Error(result.error || "Failed to update school name"))
            }
          } catch (err) {
            setError(dict.unexpectedError || "An unexpected error occurred")
            reject(err)
          }
        })
      })
    }

    useImperativeHandle(ref, () => ({
      saveAndNext,
    }))

    const titleValue = form.watch("title")
    const subdomainValue = form.watch("subdomain")
    const maxLength = FORM_LIMITS.TITLE_MAX_LENGTH

    // Auto-generate subdomain from title in real-time
    React.useEffect(() => {
      if (
        titleValue &&
        titleValue.trim().length >= FORM_LIMITS.TITLE_MIN_LENGTH
      ) {
        const generated = generateSubdomain(titleValue)
        form.setValue("subdomain", generated)
      }
    }, [titleValue, form])

    // Notify parent of title changes
    React.useEffect(() => {
      onTitleChange?.(titleValue)
    }, [titleValue, onTitleChange])

    return (
      <Form {...form}>
        <div className={`space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
          {error && (
            <div
              className={`text-destructive bg-destructive/10 rounded-md p-3 text-sm ${isRTL ? "text-end" : "text-start"}`}
            >
              {error}
            </div>
          )}

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={
                      dict.schoolNamePlaceholder ||
                      "e.g., Al-Azhar International School"
                    }
                    className={`border-input focus:border-ring h-[80px] w-full resize-none rounded-lg border p-4 text-sm transition-colors focus:outline-none sm:h-[100px] sm:p-6 sm:text-base ${isRTL ? "text-end" : "text-start"}`}
                    maxLength={maxLength}
                    disabled={isPending}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </FormControl>
                <div
                  className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : "flex-row"}`}
                >
                  <FormMessage />
                  <div className="text-muted-foreground text-xs sm:text-sm">
                    {titleValue.length}/{maxLength}
                  </div>
                </div>
              </FormItem>
            )}
          />

          {/* Subdomain field */}
          <FormField
            control={form.control}
            name="subdomain"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  className={`text-muted-foreground text-sm ${isRTL ? "text-end" : "text-start"}`}
                >
                  {dict.schoolAvailableAt ||
                    "Your school will be available at:"}
                </FormLabel>
                <FormControl>
                  <div
                    className="border-input focus-within:border-ring flex w-full items-center rounded-lg border transition-colors"
                    dir="ltr"
                  >
                    <Input
                      {...field}
                      placeholder={dict.subdomainPlaceholder || "your-school"}
                      className="rounded-r-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      disabled={isPending}
                    />
                    <span className="bg-muted text-muted-foreground rounded-r-lg border-l px-3 py-2 font-mono text-sm whitespace-nowrap">
                      .databayt.org
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    )
  }
)

TitleForm.displayName = "TitleForm"
