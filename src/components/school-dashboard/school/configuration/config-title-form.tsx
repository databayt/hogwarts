"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { Check, Loader2, Pencil } from "lucide-react"

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

import { updateSchoolName } from "./actions"

interface Props {
  schoolId: string
  initialTitle: { title: string; subdomain: string }
  translatedTitle?: string
  dictionary?: any
}

export function ConfigTitleForm({
  schoolId,
  initialTitle,
  translatedTitle,
  dictionary,
}: Props) {
  const [name, setName] = useState(initialTitle.title)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const { isRTL } = useLocale()

  const dict = (dictionary as any)?.school?.onboarding || {}
  const common = (dictionary as any)?.school?.common || {}

  const isDirty = name.trim() !== initialTitle.title
  const isValid = name.trim().length >= 3

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSchoolName(schoolId, { name: name.trim() })
      if (result.success) {
        setSaved(true)
        SuccessToast(common?.messages?.saveSuccess || "Saved")
        setTimeout(() => setSaved(false), 2000)
      } else {
        ErrorToast(result.error || dict.unexpectedError || "Error")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* School name */}
      <div className="space-y-2">
        <Textarea
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSaved(false)
          }}
          placeholder={dict.schoolNamePlaceholder || "School Name"}
          className="border-input focus:border-ring h-[80px] w-full resize-none rounded-lg border p-4 text-start text-sm transition-colors focus:outline-none sm:h-[100px] sm:p-6 sm:text-base"
          maxLength={100}
          disabled={isPending}
          dir={isRTL ? "rtl" : "ltr"}
        />
        <div className="flex items-center justify-between rtl:flex-row-reverse">
          <div />
          <div className="text-muted-foreground text-xs sm:text-sm">
            {name.length}/100
          </div>
        </div>
      </div>

      {/* Translated name preview */}
      {translatedTitle && translatedTitle !== name && (
        <p className="text-muted-foreground text-sm italic">
          {translatedTitle}
        </p>
      )}

      {/* Subdomain (read-only) */}
      <div className="space-y-2">
        <p className="text-muted-foreground text-start text-sm">
          {dict.schoolAvailableAt || "Your school will be available at:"}
        </p>
        <div
          className="border-input flex w-full items-center rounded-lg border lg:max-w-[70%]"
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
        <SubdomainChangeDialog dictionary={dictionary} />
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={isPending || !isDirty || !isValid}
          size="sm"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {common?.status?.saving || "Saving..."}
            </>
          ) : (
            common?.actions?.save || "Save"
          )}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-500">
            <Check className="h-4 w-4" />
            {common?.messages?.saveSuccess || "Saved"}
          </span>
        )}
      </div>
    </div>
  )
}

function SubdomainChangeDialog({ dictionary }: { dictionary?: any }) {
  const dict = (dictionary as any)?.school?.onboarding || {}
  const common = (dictionary as any)?.school?.common || {}

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1 text-xs transition-colors"
        >
          <Pencil className="h-3 w-3" />
          {common?.actions?.edit || "Edit"}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dict.subdomain || "Subdomain"}</AlertDialogTitle>
          <AlertDialogDescription>
            {dictionary?.school?.configuration?.subdomainWarning ||
              "Changing the subdomain will change your school's URL. All existing links, bookmarks, and shared URLs will stop working. This action requires coordination with the platform team."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {common?.actions?.close || "Close"}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
