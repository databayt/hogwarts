"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { useLocale } from "@/components/internationalization/use-locale"

import { requestSubdomainChange, updateSchoolName } from "./actions"
import { useAutoSave } from "./use-auto-save"

interface Props {
  schoolId: string
  initialTitle: { title: string; subdomain: string }
  translatedTitle?: string
  editLang?: "ar" | "en"
  storedLang?: "ar" | "en"
  dictionary?: any
}

export function ConfigTitleForm({
  schoolId,
  initialTitle,
  editLang,
  dictionary,
}: Props) {
  const [name, setName] = useState(initialTitle.title)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const { isRTL } = useLocale()

  const dict = (dictionary as any)?.school?.onboarding || {}
  const common = (dictionary as any)?.school?.common || {}

  const trimmed = name.trim()
  const isDirty = trimmed !== initialTitle.title.trim()
  const isValid = trimmed.length >= 3

  // Auto-save: debounced when dirty + valid. The hook also flushes on
  // route change so leaving the page commits the latest edit.
  useAutoSave(
    () => {
      if (!isDirty || !isValid) return
      startTransition(async () => {
        const result = await updateSchoolName(schoolId, {
          name: trimmed,
          editLang,
        })
        if (result.success) {
          setSavedAt(Date.now())
        } else {
          ErrorToast(result.error || dict.unexpectedError || "Error")
        }
      })
    },
    isDirty && isValid,
    1000
  )

  // Hide the "Saved" indicator after a short window.
  useEffect(() => {
    if (!savedAt) return
    const t = setTimeout(() => setSavedAt(null), 2000)
    return () => clearTimeout(t)
  }, [savedAt])

  return (
    <div className="space-y-6">
      {/* School name -- auto-saves on input */}
      <div className="space-y-2">
        <Textarea
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={dict.schoolNamePlaceholder || "School Name"}
          className="border-input focus:border-ring h-[80px] w-full resize-none rounded-lg border p-4 text-start text-sm transition-colors focus:outline-none sm:h-[100px] sm:p-6 sm:text-base"
          maxLength={100}
          disabled={isPending}
          dir={isRTL ? "rtl" : "ltr"}
        />
        <div className="text-muted-foreground flex items-center justify-between text-xs sm:text-sm rtl:flex-row-reverse">
          <div className="flex items-center gap-1">
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {common?.status?.saving || "Saving..."}
              </>
            ) : savedAt ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                {common?.messages?.saveSuccess || "Saved"}
              </>
            ) : null}
          </div>
          <div>{name.length}/100</div>
        </div>
      </div>

      {/* Subdomain (read-only, with inline change-request action) */}
      <div className="space-y-2">
        <p className="text-muted-foreground text-start text-sm">
          {dict.schoolAvailableAt || "Your school will be available at:"}
        </p>
        <div className="flex w-full items-center gap-2 lg:max-w-[70%]">
          <div
            className="border-input flex flex-1 items-center rounded-lg border"
            dir="ltr"
          >
            <Input
              value={initialTitle.subdomain}
              disabled
              className="rounded-e-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <span className="bg-muted text-muted-foreground rounded-e-lg border-s px-3 py-2 font-mono text-sm whitespace-nowrap">
              .databayt.org
            </span>
          </div>
          <SubdomainChangeDialog
            schoolId={schoolId}
            currentSubdomain={initialTitle.subdomain}
            dictionary={dictionary}
          />
        </div>
      </div>
    </div>
  )
}

function SubdomainChangeDialog({
  schoolId,
  currentSubdomain,
  dictionary,
}: {
  schoolId: string
  currentSubdomain: string
  dictionary?: any
}) {
  const dict = (dictionary as any)?.school?.onboarding || {}
  const common = (dictionary as any)?.school?.common || {}
  const cfg = (dictionary as any)?.school?.configuration || {}

  const [open, setOpen] = useState(false)
  const [desired, setDesired] = useState("")
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()

  // Subdomain rule mirrors the server schema -- enforce client-side too.
  const sanitized = desired.trim().toLowerCase()
  const isValid =
    sanitized.length >= 2 &&
    sanitized.length <= 40 &&
    /^[a-z0-9-]+$/.test(sanitized) &&
    sanitized !== currentSubdomain

  const handleSubmit = () => {
    if (!isValid) return
    startTransition(async () => {
      const result = await requestSubdomainChange(schoolId, {
        desiredSubdomain: sanitized,
        reason: reason.trim() || undefined,
      })
      if (result.success) {
        SuccessToast(
          cfg.subdomainRequestSent ||
            "Request submitted. The platform team will follow up."
        )
        setOpen(false)
        setDesired("")
        setReason("")
      } else {
        ErrorToast(result.error || dict.unexpectedError || "Error")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" type="button">
          {common?.actions?.edit || "Edit"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dict.subdomain || "Subdomain"}</AlertDialogTitle>
          <AlertDialogDescription>
            {cfg.subdomainWarning ||
              "Changing the subdomain will change your school's URL. All existing links, bookmarks, and shared URLs will stop working. This action requires coordination with the platform team."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {cfg.desiredSubdomain || "Desired subdomain"}
            </label>
            <div
              className="border-input flex items-center rounded-lg border"
              dir="ltr"
            >
              <Input
                value={desired}
                onChange={(e) => setDesired(e.target.value)}
                placeholder={dict.subdomainPlaceholder || "subdomain"}
                className="rounded-e-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                maxLength={40}
                disabled={isPending}
              />
              <span className="bg-muted text-muted-foreground rounded-e-lg border-s px-3 py-2 font-mono text-sm whitespace-nowrap">
                .databayt.org
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              {cfg.subdomainReason || "Reason (optional)"}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                cfg.subdomainReasonPlaceholder || "Why do you need this change?"
              }
              maxLength={500}
              className="h-24 resize-none"
              disabled={isPending}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {common?.actions?.close || "Close"}
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            size="sm"
          >
            {isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {common?.status?.submitting || "Submitting..."}
              </>
            ) : (
              cfg.submitRequest || "Submit request"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
