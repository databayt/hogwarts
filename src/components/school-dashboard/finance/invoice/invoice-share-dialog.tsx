"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Share dialog for an invoice's public link — credentials-dialog shape: a
// public-link toggle, the URL with copy feedback, and a fixed icon row
// (WhatsApp / Email) that renders disabled instead of disappearing when the
// recipient has no phone/email on file, so the layout never shifts.
import { useMemo, useState, useTransition } from "react"
import { Check, Copy, Mail, MessageCircle, Share2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  buildShareLink,
  fillTemplate,
  normalizePhone,
} from "@/components/school-dashboard/listings/credentials/share"

import { revokeInvoiceShare, shareInvoice } from "./share"

interface Props {
  invoiceId: string
  invoiceNo: string
  schoolName: string | null
  initialToken: string | null
  initialIsPublic: boolean
  recipientEmail: string | null
  recipientPhone: string | null
  lang: string
  dictionary: Dictionary
}

export function InvoiceShareDialog({
  invoiceId,
  invoiceNo,
  schoolName,
  initialToken,
  initialIsPublic,
  recipientEmail,
  recipientPhone,
  lang,
  dictionary,
}: Props) {
  const t = ((dictionary as Record<string, any>)?.finance?.invoiceShare ??
    {}) as Record<string, string>
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [token, setToken] = useState(initialToken)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const shareUrl =
    isPublic && token
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/${lang}/invoice/${token}`
      : null

  const message = useMemo(
    () =>
      fillTemplate(
        t.message ||
          "Invoice {number} from {school}. View and print it here: {url}",
        {
          number: invoiceNo,
          school: schoolName ?? "",
          url: shareUrl ?? "",
        }
      ),
    [t.message, invoiceNo, schoolName, shareUrl]
  )

  const whatsapp =
    shareUrl && normalizePhone(recipientPhone)
      ? buildShareLink({
          phone: recipientPhone,
          email: null,
          message,
          subject: "",
        })
      : null
  const email =
    shareUrl && recipientEmail
      ? buildShareLink({
          phone: null,
          email: recipientEmail,
          message,
          subject: fillTemplate(t.emailSubject || "Invoice {number}", {
            number: invoiceNo,
          }),
        })
      : null

  function handleToggle(next: boolean) {
    startTransition(async () => {
      if (next) {
        const result = await shareInvoice(invoiceId)
        if (result.success && result.data) {
          setToken(result.data.token)
          setIsPublic(true)
        } else {
          toast.error(t.enableFailed || "Could not enable the public link.")
        }
      } else {
        const result = await revokeInvoiceShare(invoiceId)
        if (result.success) {
          setIsPublic(false)
        } else {
          toast.error(t.revokeFailed || "Could not revoke the public link.")
        }
      }
    })
  }

  async function handleCopy() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success(t.copied || "Link copied")
    setTimeout(() => setCopied(false), 2000)
  }

  const channelIcon =
    "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent"
  const channelDisabled = "pointer-events-none opacity-40"

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="print:hidden">
          <Share2 className="me-2 h-4 w-4" />
          {t.button || "Share"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title || "Share invoice"}</DialogTitle>
          <DialogDescription>
            {t.description ||
              "Anyone with the link can view and print this invoice — no account needed. Revoking keeps the same link for later re-enabling."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="invoice-share-toggle" className="text-sm">
            {t.toggle || "Public link"}
          </Label>
          <Switch
            id="invoice-share-toggle"
            checked={isPublic}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>

        {shareUrl ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input readOnly value={shareUrl} className="text-xs" dir="ltr" />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleCopy}
                aria-label={t.copy || "Copy link"}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={whatsapp?.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                aria-disabled={!whatsapp}
                className={cn(channelIcon, !whatsapp && channelDisabled)}
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href={email?.href}
                aria-label={t.emailChannel || "Email"}
                aria-disabled={!email}
                className={cn(channelIcon, !email && channelDisabled)}
              >
                <Mail className="h-4 w-4" />
              </a>
              <span className="text-muted-foreground ms-1 text-xs">
                {t.channelsHint || "Send via WhatsApp or email"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {t.disabledHint || "Enable the public link to share this invoice."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
