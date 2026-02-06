"use client"

import { useEffect, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useModal } from "@/components/atom/modal/context"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { Icons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"

import { createScoreRange, getScoreRange, updateScoreRange } from "./actions"
import {
  scoreRangeCreateSchema,
  type ScoreRangeCreateInput,
} from "./validation"

interface ScoreRangeFormProps {
  onSuccess?: () => void
  lang?: Locale
}

export function ScoreRangeForm({
  onSuccess,
  lang = "en",
}: ScoreRangeFormProps) {
  const { modal, closeModal } = useModal()
  const [isPending, startTransition] = useTransition()
  const itemId = modal.id
  const isEdit = !!itemId

  const t = {
    title: isEdit
      ? lang === "ar"
        ? "تعديل نطاق الدرجات"
        : "Edit Grade Range"
      : lang === "ar"
        ? "إضافة نطاق درجات"
        : "Add Grade Range",
    grade: lang === "ar" ? "الدرجة" : "Grade",
    gradePlaceholder: lang === "ar" ? "مثال: A+" : "e.g., A+",
    gradeDescription:
      lang === "ar"
        ? "رمز الدرجة مثل A+, A, B+, B, C, D, F"
        : "Grade symbol like A+, A, B+, B, C, D, F",
    minScore: lang === "ar" ? "الحد الأدنى (%)" : "Minimum Score (%)",
    maxScore: lang === "ar" ? "الحد الأقصى (%)" : "Maximum Score (%)",
    cancel: lang === "ar" ? "إلغاء" : "Cancel",
    save: lang === "ar" ? "حفظ" : "Save",
    saving: lang === "ar" ? "جاري الحفظ..." : "Saving...",
    createSuccess:
      lang === "ar"
        ? "تم إنشاء نطاق الدرجات بنجاح"
        : "Grade range created successfully",
    updateSuccess:
      lang === "ar"
        ? "تم تحديث نطاق الدرجات بنجاح"
        : "Grade range updated successfully",
  }

  const form = useForm<ScoreRangeCreateInput>({
    resolver: zodResolver(scoreRangeCreateSchema) as any,
    defaultValues: {
      grade: "",
      minScore: 0,
      maxScore: 100,
    },
  })

  // Load existing data for edit mode
  useEffect(() => {
    if (isEdit) {
      startTransition(async () => {
        const result = await getScoreRange({ id: itemId })
        if (result.success && result.data) {
          form.reset({
            grade: result.data.grade,
            minScore: result.data.minScore,
            maxScore: result.data.maxScore,
          })
        }
      })
    }
  }, [isEdit, itemId, form])

  const onSubmit = async (data: ScoreRangeCreateInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateScoreRange({ ...data, id: itemId })
        : await createScoreRange(data)

      if (result.success) {
        SuccessToast(isEdit ? t.updateSuccess : t.createSuccess)
        closeModal()
        onSuccess?.()
      } else {
        ErrorToast(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icons.award className="text-primary h-5 w-5" />
        <h2 className="font-semibold">{t.title}</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="grade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.grade}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.gradePlaceholder}
                    {...field}
                    disabled={isPending}
                    className="font-mono"
                  />
                </FormControl>
                <FormDescription>{t.gradeDescription}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="minScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.minScore}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.maxScore}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isPending}
            >
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Icons.loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t.saving}
                </>
              ) : (
                t.save
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
