"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type SubmitHandler } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"

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
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  LEAD_PRIORITY,
  LEAD_SOURCE,
  LEAD_STATUS,
  LEAD_TYPE,
  type LeadPriorityKey,
  type LeadSourceKey,
  type LeadStatusKey,
  type LeadTypeKey,
} from "@/components/sales/constants"
import { createLeadSchema } from "@/components/sales/validation"

import {
  createOperatorLead,
  updateOperatorLead,
  type OperatorLeadDetail,
} from "./actions"

// Countries we sell into. Order follows sales.mdx priority: SD (beachhead),
// SA (largest market), EG, AE, then wider MENA. Free-text via "OTHER" sentinel
// keeps us honest about regions we haven't pre-listed.
const COUNTRY_OPTIONS = [
  "SD",
  "EG",
  "SA",
  "AE",
  "JO",
  "QA",
  "KW",
  "OM",
  "BH",
  "LB",
  "MA",
  "TN",
  "DZ",
  "LY",
  "YE",
  "IQ",
  "SY",
  "PS",
] as const

type LeadFormValues = z.input<typeof createLeadSchema>

export type LeadFormMode = "create" | "edit"

interface OperatorLeadFormProps {
  mode: LeadFormMode
  /** Required when mode = "edit". The detail server component preloads this. */
  initialData?: OperatorLeadDetail
  dictionary?: Dictionary["sales"]
  lang: Locale
}

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

function fromDateInputValue(value: string): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function OperatorLeadForm({
  mode,
  initialData,
  dictionary,
  lang,
}: OperatorLeadFormProps) {
  const router = useRouter()
  const isEditing = mode === "edit"

  // Translations from dictionary
  const f = dictionary?.form
  const c = dictionary?.country
  const t = {
    name: f?.name ?? "Name",
    email: f?.email ?? "Email",
    phone: f?.phone ?? "Phone",
    company: f?.company ?? "Company",
    title_field: f?.jobTitle ?? "Job Title",
    website: f?.website ?? "Website",
    linkedin: f?.linkedin ?? "LinkedIn",
    leadType: f?.leadType ?? "Lead Type",
    industry: f?.industry ?? "Industry",
    location: f?.location ?? "Location",
    country: f?.country ?? "Country",
    countryPlaceholder: f?.countryPlaceholder ?? "Select country",
    status: f?.status ?? "Status",
    source: f?.source ?? "Source",
    priority: f?.priority ?? "Priority",
    score: f?.score ?? "Score",
    notes: f?.notes ?? "Notes",
    nextFollowUpAt: f?.nextFollowUpAt ?? "Next follow-up",
    nextFollowUpHelp:
      f?.nextFollowUpHelp ??
      "When you plan to next reach out — overdue rows light up red.",
    tags: f?.tags ?? "Tags",
    tagsPlaceholder: f?.tagsPlaceholder ?? "Comma-separated tags",
    save: f?.save ?? "Save",
    cancel: f?.cancel ?? "Cancel",
    creating: f?.creating ?? "Creating...",
    updating: f?.updating ?? "Updating...",
    // Status options
    NEW: dictionary?.status?.NEW ?? "New",
    CONTACTED: dictionary?.status?.CONTACTED ?? "Contacted",
    QUALIFIED: dictionary?.status?.QUALIFIED ?? "Qualified",
    PROPOSAL: dictionary?.status?.PROPOSAL ?? "Proposal",
    NEGOTIATION: dictionary?.status?.NEGOTIATION ?? "Negotiation",
    CLOSED_WON: dictionary?.status?.CLOSED_WON ?? "Closed Won",
    CLOSED_LOST: dictionary?.status?.CLOSED_LOST ?? "Closed Lost",
    ARCHIVED: dictionary?.status?.ARCHIVED ?? "Archived",
    // Source options
    MANUAL: dictionary?.source?.MANUAL ?? "Manual",
    IMPORT: dictionary?.source?.IMPORT ?? "Import",
    WEBSITE: dictionary?.source?.WEBSITE ?? "Website",
    REFERRAL: dictionary?.source?.REFERRAL ?? "Referral",
    SOCIAL_MEDIA: dictionary?.source?.SOCIAL_MEDIA ?? "Social Media",
    EMAIL_CAMPAIGN: dictionary?.source?.EMAIL_CAMPAIGN ?? "Email Campaign",
    COLD_CALL: dictionary?.source?.COLD_CALL ?? "Cold Call",
    CONFERENCE: dictionary?.source?.CONFERENCE ?? "Conference",
    PARTNER: dictionary?.source?.PARTNER ?? "Partner",
    // Priority options
    LOW: dictionary?.priority?.LOW ?? "Low",
    MEDIUM: dictionary?.priority?.MEDIUM ?? "Medium",
    HIGH: dictionary?.priority?.HIGH ?? "High",
    URGENT: dictionary?.priority?.URGENT ?? "Urgent",
    // Type options
    SCHOOL: dictionary?.type?.SCHOOL ?? "School",
    PARTNERSHIP: dictionary?.type?.PARTNERSHIP ?? "Partnership",
    OTHER: dictionary?.type?.OTHER ?? "Other",
  }

  const defaultValues: LeadFormValues = {
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    company: initialData?.company ?? "",
    title: initialData?.title ?? "",
    website: initialData?.website ?? "",
    linkedinUrl: initialData?.linkedinUrl ?? "",
    leadType: initialData?.leadType ?? "SCHOOL",
    industry: initialData?.industry ?? "",
    location: initialData?.location ?? "",
    country: initialData?.country ?? "",
    status: initialData?.status ?? "NEW",
    source: initialData?.source ?? "MANUAL",
    priority: initialData?.priority ?? "MEDIUM",
    score: initialData?.score ?? 50,
    notes: initialData?.notes ?? "",
    tags: initialData?.tags ?? [],
    verified: initialData?.verified ?? false,
    nextFollowUpAt: initialData?.nextFollowUpAt ?? null,
    lastContactedAt: initialData?.lastContactedAt ?? null,
  }

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues,
  })

  const onSubmit: SubmitHandler<LeadFormValues> = async (values) => {
    try {
      const res = isEditing
        ? await updateOperatorLead(
            initialData!.id,
            values as Parameters<typeof updateOperatorLead>[1]
          )
        : await createOperatorLead(
            values as Parameters<typeof createOperatorLead>[0]
          )

      if (res?.success) {
        const successMsg = isEditing
          ? (dictionary?.messages?.updateSuccess ?? "Lead updated successfully")
          : (dictionary?.messages?.createSuccess ?? "Lead created successfully")
        toast.success(successMsg)
        if (isEditing) {
          router.refresh()
        } else {
          // Land on the detail page — that's where the activity timeline +
          // follow-up history live, so it's the natural next step.
          router.push(`/${lang}/sales/${res.data.id}`)
        }
      } else {
        // Prefer the dictionary message over `res.error` (server-side English)
        // so an Arabic UI doesn't leak English. The raw error stays in the
        // console for debugging.
        if ("error" in res) console.error("[OperatorLeadForm]", res.error)
        const errorMsg = isEditing
          ? (dictionary?.messages?.updateError ?? "Failed to update lead")
          : (dictionary?.messages?.createError ?? "Failed to create lead")
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error(
        dictionary?.messages?.unexpectedError ?? "An unexpected error occurred"
      )
    }
  }

  const onCancel = () => {
    if (isEditing) {
      router.push(`/${lang}/sales`)
    } else {
      router.back()
    }
  }

  const isSubmitting = form.formState.isSubmitting

  // Tags ↔ comma-separated string adapter. Lead.tags is `string[]`; the form
  // exposes a single Input for ergonomic editing. We split on comma and trim
  // empties so a user can paste "network, tier-a, sd".
  const tagsValue = (form.watch("tags") ?? []).join(", ")
  const onTagsChange = (raw: string) => {
    const tags = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    form.setValue("tags", tags, { shouldDirty: true })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Contact */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.name} *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.name} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.email}</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder={t.email} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.phone}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.phone} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.company}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.company} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.title_field}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.title_field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.website}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Classification */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="leadType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.leadType}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t.leadType} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(LEAD_TYPE) as LeadTypeKey[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {t[type] || type}
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
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.industry}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.industry} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.country}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t.countryPlaceholder} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((code) => (
                      <SelectItem key={code} value={code}>
                        {c?.[code as keyof typeof c] ?? code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pipeline */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.status}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t.status} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(LEAD_STATUS) as LeadStatusKey[]).map(
                      (status) => (
                        <SelectItem key={status} value={status}>
                          {t[status] || status}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.source}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t.source} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(LEAD_SOURCE) as LeadSourceKey[]).map(
                      (source) => (
                        <SelectItem key={source} value={source}>
                          {t[source] || source}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.priority}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t.priority} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(LEAD_PRIORITY) as LeadPriorityKey[]).map(
                      (priority) => (
                        <SelectItem key={priority} value={priority}>
                          {t[priority] || priority}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.score}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? 50}
                    type="number"
                    min={0}
                    max={100}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Follow-up + tags */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nextFollowUpAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.nextFollowUpAt}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={toDateInputValue(field.value as Date | null)}
                    onChange={(e) =>
                      field.onChange(fromDateInputValue(e.target.value))
                    }
                  />
                </FormControl>
                <FormDescription>{t.nextFollowUpHelp}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>{t.tags}</FormLabel>
            <FormControl>
              <Input
                placeholder={t.tagsPlaceholder}
                value={tagsValue}
                onChange={(e) => onTagsChange(e.target.value)}
              />
            </FormControl>
          </FormItem>
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.notes}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder={t.notes} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditing ? t.updating : t.creating) : t.save}
          </Button>
        </div>
      </form>
    </Form>
  )
}
