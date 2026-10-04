"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { Download, Loader2, Printer } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { issueBatchLogins } from "./actions"
import type { LoginCredential } from "./engine/types"
import type { ImportType } from "./fields"
import { downloadLogins, openPrintWindow, printSlips } from "./logins"
import { errorText, fmt, type BulkText } from "./text"

/**
 * Download / print the logins of one batch. Passwords are minted on the
 * first click and reused for the rest of this visit, so the CSV and the
 * slips always agree; a later visit mints new ones.
 */
export function LoginActions({
  batchId,
  type,
  t,
  lang,
  size = "sm",
}: {
  batchId: string
  type: ImportType
  t: BulkText
  lang: string
  size?: "sm" | "default"
}) {
  const [busy, setBusy] = useState<"csv" | "print" | null>(null)
  const [credentials, setCredentials] = useState<LoginCredential[] | null>(null)

  async function load(): Promise<LoginCredential[] | null> {
    if (credentials) return credentials
    const res = await issueBatchLogins(batchId)
    if (!res.ok) {
      toast.error(errorText(t, res.code))
      return null
    }
    if (res.credentials.length === 0) {
      toast.info(t.loginsNone)
      return null
    }
    if (res.active > 0) toast.info(fmt(t.loginsActive, { count: res.active }))
    setCredentials(res.credentials)
    return res.credentials
  }

  async function onDownload() {
    setBusy("csv")
    try {
      const list = await load()
      if (list) downloadLogins(list, type, t)
    } finally {
      setBusy(null)
    }
  }

  async function onPrint() {
    const w = openPrintWindow()
    setBusy("print")
    try {
      const list = await load()
      if (!list || !w) {
        w?.close()
        return
      }
      await printSlips(w, list, t, {
        lang,
        loginUrl: `${window.location.origin}/${lang}/login`,
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={onDownload}
        disabled={busy !== null}
      >
        {busy === "csv" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {t.downloadLogins}
      </Button>
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={onPrint}
        disabled={busy !== null}
      >
        {busy === "print" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        {t.printSlips}
      </Button>
    </div>
  )
}
