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

import { createSchoolYear, getSchoolYear, updateSchoolYear } from "./actions"
import {
  schoolYearCreateSchema,
  type SchoolYearCreateInput,
} from "./validation"

interface SchoolYearFormProps {
  onSuccess?: () => void
  lang?: Locale
}

export function SchoolYearForm({
  onSuccess,
  lang = "en",
}: SchoolYearFormProps) {
  const { modal, closeModal } = useModal()
  const [isPending, startTransition] = useTransition()
  const itemId = modal.id
  const isEdit = !!itemId

  const t = {
    title: isEdit
      ? lang === "ar"
        ? "تعديل العام الدراسي"
        : "Edit Academic Year"
      : lang === "ar"
        ? "إضافة عام دراسي"
        : "Add Academic Year",
    yearName: lang === "ar" ? "اسم العام الدراسي" : "Year Name",
    yearNamePlaceholder: lang === "ar" ? "مثال: 2024-2025" : "e.g., 2024-2025",
    startDate: lang === "ar" ? "تاريخ البداية" : "Start Date",
    endDate: lang === "ar" ? "تاريخ النهاية" : "End Date",
    cancel: lang === "ar" ? "إلغاء" : "Cancel",
    save: lang === "ar" ? "حفظ" : "Save",
    saving: lang === "ar" ? "جاري الحفظ..." : "Saving...",
    createSuccess:
      lang === "ar"
        ? "تم إنشاء العام الدراسي بنجاح"
        : "Academic year created successfully",
    updateSuccess:
      lang === "ar"
        ? "تم تحديث العام الدراسي بنجاح"
        : "Academic year updated successfully",
  }

  const form = useForm<SchoolYearCreateInput>({
    resolver: zodResolver(schoolYearCreateSchema) as any,
    defaultValues: {
      yearName: "",
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  })

  // Load existing data for edit mode
  useEffect(() => {
    if (isEdit) {
      startTransition(async () => {
        const result = await getSchoolYear({ id: itemId })
        if (result.success && result.data) {
          form.reset({
            yearName: result.data.yearName,
            startDate: new Date(result.data.startDate),
            endDate: new Date(result.data.endDate),
          })
        }
      })
    }
  }, [isEdit, itemId, form])

  const onSubmit = async (data: SchoolYearCreateInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateSchoolYear({ ...data, id: itemId })
        : await createSchoolYear(data)

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
        <Icons.calendar className="text-primary h-5 w-5" />
        <h2 className="font-semibold">{t.title}</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="yearName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.yearName}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.yearNamePlaceholder}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.startDate}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : new Date()
                        field.onChange(date)
                      }}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.endDate}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : new Date()
                        field.onChange(date)
                      }}
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
