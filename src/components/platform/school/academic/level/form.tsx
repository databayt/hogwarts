"use client"

import { useEffect, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
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

import { createYearLevel, getYearLevel, updateYearLevel } from "./actions"
import { yearLevelCreateSchema, type YearLevelCreateInput } from "./validation"

interface YearLevelFormProps {
  onSuccess?: () => void
  lang?: Locale
}

export function YearLevelForm({ onSuccess, lang = "en" }: YearLevelFormProps) {
  const { modal, closeModal } = useModal()
  const [isPending, startTransition] = useTransition()
  const itemId = modal.id
  const isEdit = !!itemId

  const t = {
    title: isEdit
      ? lang === "ar"
        ? "تعديل المرحلة الدراسية"
        : "Edit Year Level"
      : lang === "ar"
        ? "إضافة مرحلة دراسية"
        : "Add Year Level",
    levelName:
      lang === "ar" ? "اسم المرحلة (بالإنجليزية)" : "Level Name (English)",
    levelNamePlaceholder: lang === "ar" ? "مثال: Grade 1" : "e.g., Grade 1",
    levelNameAr:
      lang === "ar" ? "اسم المرحلة (بالعربية)" : "Level Name (Arabic)",
    levelNameArPlaceholder:
      lang === "ar" ? "مثال: الصف الأول" : "e.g., الصف الأول",
    levelOrder: lang === "ar" ? "ترتيب المرحلة" : "Level Order",
    levelOrderPlaceholder: lang === "ar" ? "مثال: 1" : "e.g., 1",
    cancel: lang === "ar" ? "إلغاء" : "Cancel",
    save: lang === "ar" ? "حفظ" : "Save",
    saving: lang === "ar" ? "جاري الحفظ..." : "Saving...",
    createSuccess:
      lang === "ar"
        ? "تم إنشاء المرحلة بنجاح"
        : "Year level created successfully",
    updateSuccess:
      lang === "ar"
        ? "تم تحديث المرحلة بنجاح"
        : "Year level updated successfully",
  }

  const form = useForm<YearLevelCreateInput>({
    resolver: zodResolver(yearLevelCreateSchema) as any,
    defaultValues: {
      levelName: "",
      levelNameAr: "",
      levelOrder: 1,
    },
  })

  // Load existing data for edit mode
  useEffect(() => {
    if (isEdit) {
      startTransition(async () => {
        const result = await getYearLevel({ id: itemId })
        if (result.success && result.data) {
          form.reset({
            levelName: result.data.levelName,
            levelNameAr: result.data.levelNameAr || "",
            levelOrder: result.data.levelOrder,
          })
        }
      })
    }
  }, [isEdit, itemId, form])

  const onSubmit = async (data: YearLevelCreateInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateYearLevel({ ...data, id: itemId })
        : await createYearLevel(data)

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
        <Icons.graduationCap className="text-primary h-5 w-5" />
        <h2 className="font-semibold">{t.title}</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="levelName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.levelName}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.levelNamePlaceholder}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="levelNameAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.levelNameAr}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.levelNameArPlaceholder}
                    {...field}
                    value={field.value || ""}
                    disabled={isPending}
                    dir="rtl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="levelOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.levelOrder}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder={t.levelOrderPlaceholder}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 1)
                    }
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                  <Icons.loader2 className="mr-2 h-4 w-4 animate-spin" />
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
