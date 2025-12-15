"use client"

import { useEffect, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Clock, Loader2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useModal } from "@/components/atom/modal/context"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"

import { getSchoolYearOptions } from "../year/actions"
import { createPeriod, getPeriod, updatePeriod } from "./actions"
import { periodCreateSchema, type PeriodCreateInput } from "./validation"

interface PeriodFormProps {
  onSuccess?: () => void
  lang?: Locale
}

export function PeriodForm({ onSuccess, lang = "en" }: PeriodFormProps) {
  const { modal, closeModal } = useModal()
  const [isPending, startTransition] = useTransition()
  const [years, setYears] = useState<Array<{ id: string; yearName: string }>>(
    []
  )
  const itemId = modal.id
  const isEdit = !!itemId

  const t = {
    title: isEdit
      ? lang === "ar"
        ? "تعديل الحصة"
        : "Edit Period"
      : lang === "ar"
        ? "إضافة حصة"
        : "Add Period",
    academicYear: lang === "ar" ? "العام الدراسي" : "Academic Year",
    selectYear: lang === "ar" ? "اختر العام الدراسي" : "Select academic year",
    name: lang === "ar" ? "اسم الحصة" : "Period Name",
    namePlaceholder: lang === "ar" ? "مثال: الحصة الأولى" : "e.g., Period 1",
    startTime: lang === "ar" ? "وقت البداية" : "Start Time",
    endTime: lang === "ar" ? "وقت النهاية" : "End Time",
    cancel: lang === "ar" ? "إلغاء" : "Cancel",
    save: lang === "ar" ? "حفظ" : "Save",
    saving: lang === "ar" ? "جاري الحفظ..." : "Saving...",
    createSuccess:
      lang === "ar" ? "تم إنشاء الحصة بنجاح" : "Period created successfully",
    updateSuccess:
      lang === "ar" ? "تم تحديث الحصة بنجاح" : "Period updated successfully",
  }

  const form = useForm<PeriodCreateInput>({
    resolver: zodResolver(periodCreateSchema) as any,
    defaultValues: {
      yearId: "",
      name: "",
      startTime: "08:00",
      endTime: "08:45",
    },
  })

  // Load school years for dropdown
  useEffect(() => {
    startTransition(async () => {
      const result = await getSchoolYearOptions()
      if (result.success && result.data) {
        setYears(result.data)
      }
    })
  }, [])

  // Load existing data for edit mode
  useEffect(() => {
    if (isEdit) {
      startTransition(async () => {
        const result = await getPeriod({ id: itemId })
        if (result.success && result.data) {
          const startTime =
            result.data.startTime instanceof Date
              ? result.data.startTime.toTimeString().slice(0, 5)
              : "08:00"
          const endTime =
            result.data.endTime instanceof Date
              ? result.data.endTime.toTimeString().slice(0, 5)
              : "08:45"

          form.reset({
            yearId: result.data.yearId,
            name: result.data.name,
            startTime,
            endTime,
          })
        }
      })
    }
  }, [isEdit, itemId, form])

  const onSubmit = async (data: PeriodCreateInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updatePeriod({ ...data, id: itemId })
        : await createPeriod(data)

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
        <Clock className="text-primary h-5 w-5" />
        <h2 className="font-semibold">{t.title}</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="yearId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.academicYear}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectYear} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.yearName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.name}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.namePlaceholder}
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
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.startTime}</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.endTime}</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} disabled={isPending} />
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
