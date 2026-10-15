"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, RefreshCw } from "lucide-react"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { collectGrades } from "../actions/collect"

/** One tap: pull every graded homework mark into the gradebook. */
export function CollectButton() {
  const router = useRouter()
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.grades?.overview?.collect
  const [pending, startTransition] = useTransition()

  const run = () =>
    startTransition(async () => {
      const res = await collectGrades()
      if (!res.success || !res.data) {
        ErrorToast(actionErrorMessage(res.error, dictionary, t?.failed ?? ""))
        return
      }
      const nf = new Intl.NumberFormat(document.documentElement.lang || "ar")
      SuccessToast(
        (res.data.remaining > 0 ? t?.collectedMore : (t?.collected ?? ""))
          ?.replace("{count}", nf.format(res.data.recorded))
          .replace("{remaining}", nf.format(res.data.remaining)) ?? ""
      )
      router.refresh()
    })

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <RefreshCw className="size-3" />
      )}
      {t?.collectNow}
    </button>
  )
}
