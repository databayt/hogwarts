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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useModal } from "@/components/atom/modal/context"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { Icons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { createCampaign, getCampaign, updateCampaign } from "./actions"
import {
  campaignSchemaWithValidation,
  campaignStatusOptions,
  type CampaignFormData,
} from "./validation"

interface CampaignFormProps {
  onSuccess?: () => void
  lang?: Locale
  dictionary?: Dictionary["school"]["admission"]
}

export function CampaignForm({
  onSuccess,
  lang = "en",
  dictionary,
}: CampaignFormProps) {
  const { modal, closeModal } = useModal()
  const [isPending, startTransition] = useTransition()
  const itemId = modal.id
  const isEdit = !!itemId

  const t = dictionary?.campaigns ?? {}
  const isRTL = lang === "ar"

  const labels = {
    title: isEdit
      ? isRTL
        ? "تعديل الحملة"
        : "Edit Campaign"
      : isRTL
        ? "إنشاء حملة"
        : "Create Campaign",
    name: isRTL ? "اسم الحملة" : "Campaign Name",
    namePlaceholder: isRTL
      ? "مثال: قبول 2024-2025"
      : "e.g., Admissions 2024-2025",
    academicYear: isRTL ? "العام الدراسي" : "Academic Year",
    academicYearPlaceholder: isRTL ? "مثال: 2024-2025" : "e.g., 2024-2025",
    startDate: isRTL ? "تاريخ البداية" : "Start Date",
    endDate: isRTL ? "تاريخ الانتهاء" : "End Date",
    status: isRTL ? "الحالة" : "Status",
    description: isRTL ? "الوصف" : "Description",
    descriptionPlaceholder: isRTL
      ? "وصف اختياري للحملة..."
      : "Optional campaign description...",
    totalSeats: isRTL ? "المقاعد المتاحة" : "Total Seats",
    applicationFee: isRTL ? "رسوم التقديم" : "Application Fee",
    cancel: isRTL ? "إلغاء" : "Cancel",
    save: isRTL ? "حفظ" : "Save",
    saving: isRTL ? "جاري الحفظ..." : "Saving...",
    createSuccess: isRTL
      ? "تم إنشاء الحملة بنجاح"
      : "Campaign created successfully",
    updateSuccess: isRTL
      ? "تم تحديث الحملة بنجاح"
      : "Campaign updated successfully",
  }

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchemaWithValidation) as any,
    defaultValues: {
      name: "",
      academicYear: "",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      status: "DRAFT",
      description: "",
      totalSeats: 100,
      applicationFee: 0,
    },
  })

  // Load existing data for edit mode
  useEffect(() => {
    if (isEdit) {
      startTransition(async () => {
        const result = await getCampaign({ id: itemId })
        if (result.success && result.data) {
          const d = result.data
          form.reset({
            name: d.name,
            academicYear: d.academicYear,
            startDate: new Date(d.startDate),
            endDate: new Date(d.endDate),
            status: d.status as CampaignFormData["status"],
            description: d.description ?? "",
            totalSeats: d.totalSeats,
            applicationFee: d.applicationFee
              ? parseFloat(d.applicationFee)
              : undefined,
          })
        }
      })
    }
  }, [isEdit, itemId, form])

  const onSubmit = async (data: CampaignFormData) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateCampaign({ ...data, id: itemId })
        : await createCampaign(data)

      if (result.success) {
        SuccessToast(isEdit ? labels.updateSuccess : labels.createSuccess)
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
        <Icons.fileText className="text-primary h-5 w-5" />
        <h2 className="font-semibold">{labels.title}</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labels.name}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={labels.namePlaceholder}
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
              name="academicYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.academicYear}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={labels.academicYearPlaceholder}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.status}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={labels.status} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campaignStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.startDate}</FormLabel>
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
                  <FormLabel>{labels.endDate}</FormLabel>
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="totalSeats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.totalSeats}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
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
              name="applicationFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.applicationFee}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    {isRTL ? "اتركه 0 إذا كان مجاني" : "Leave 0 if free"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labels.description}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={labels.descriptionPlaceholder}
                    className="resize-none"
                    rows={3}
                    {...field}
                    value={field.value ?? ""}
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
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Icons.loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {labels.saving}
                </>
              ) : (
                labels.save
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default CampaignForm
