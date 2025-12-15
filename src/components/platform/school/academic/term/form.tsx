"use client"

import { useEffect, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { createTerm, getTerm, updateTerm } from "./actions"
import { termCreateSchema, type TermCreateInput } from "./validation"

interface TermFormProps {
  onSuccess?: () => void
  lang?: Locale
}

export function TermForm({ onSuccess, lang = "en" }: TermFormProps) {
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
        ? "تعديل الفصل الدراسي"
        : "Edit Term"
      : lang === "ar"
        ? "إضافة فصل دراسي"
        : "Add Term",
    academicYear: lang === "ar" ? "العام الدراسي" : "Academic Year",
    selectYear: lang === "ar" ? "اختر العام الدراسي" : "Select academic year",
    termNumber: lang === "ar" ? "رقم الفصل" : "Term Number",
    termNumberPlaceholder: lang === "ar" ? "مثال: 1" : "e.g., 1",
    startDate: lang === "ar" ? "تاريخ البداية" : "Start Date",
    endDate: lang === "ar" ? "تاريخ النهاية" : "End Date",
    isActive: lang === "ar" ? "الفصل الحالي" : "Current Term",
    isActiveDescription:
      lang === "ar"
        ? "تعيين هذا الفصل كالفصل الدراسي النشط"
        : "Set this as the active academic term",
    cancel: lang === "ar" ? "إلغاء" : "Cancel",
    save: lang === "ar" ? "حفظ" : "Save",
    saving: lang === "ar" ? "جاري الحفظ..." : "Saving...",
    createSuccess:
      lang === "ar" ? "تم إنشاء الفصل بنجاح" : "Term created successfully",
    updateSuccess:
      lang === "ar" ? "تم تحديث الفصل بنجاح" : "Term updated successfully",
  }

  const form = useForm<TermCreateInput>({
    resolver: zodResolver(termCreateSchema) as any,
    defaultValues: {
      yearId: "",
      termNumber: 1,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
      isActive: false,
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
        const result = await getTerm({ id: itemId })
        if (result.success && result.data) {
          form.reset({
            yearId: result.data.yearId,
            termNumber: result.data.termNumber,
            startDate: new Date(result.data.startDate),
            endDate: new Date(result.data.endDate),
            isActive: result.data.isActive,
          })
        }
      })
    }
  }, [isEdit, itemId, form])

  const onSubmit = async (data: TermCreateInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateTerm({ ...data, id: itemId })
        : await createTerm(data)

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
        <Calendar className="text-primary h-5 w-5" />
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
            name="termNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.termNumber}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={4}
                    placeholder={t.termNumberPlaceholder}
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

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{t.isActive}</FormLabel>
                  <FormDescription>{t.isActiveDescription}</FormDescription>
                </div>
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
