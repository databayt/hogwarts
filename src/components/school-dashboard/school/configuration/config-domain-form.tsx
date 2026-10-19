"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import Link from "next/link"
import { Check, ChevronDown, Copy, ExternalLink, Loader2 } from "lucide-react"

import { LIVE_ROOT_DOMAIN } from "@/lib/root-domain"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import {
  cancelDomainRequest,
  createDomainRequest,
} from "../../settings/domain-request/actions"
import { SettingsGroup, SettingsRow } from "./ui/settings-group"

interface DomainRequest {
  id: string
  domain: string
  status: string
  notes?: string | null
  createdAt: Date
  verifiedAt?: Date | null
}

interface ConfigDomainFormProps {
  currentDomain?: string
  existingRequests: DomainRequest[]
  dictionary?: Dictionary
}

const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/
const EXAMPLE = "myschool.edu.sd"

/** Splice an LTR value into a translated sentence at `{key}`. */
function withLtr(tpl: string, key: string, value: React.ReactNode) {
  const [before, after = ""] = tpl.split(`{${key}}`)
  return (
    <>
      {before}
      <bdi dir="ltr" className="font-mono">
        {value}
      </bdi>
      {after}
    </>
  )
}

export function ConfigDomainForm({
  currentDomain,
  existingRequests = [],
  dictionary: dictionaryProp,
}: ConfigDomainFormProps) {
  const dictionary = useDictionaryFallback(dictionaryProp)
  const t: Partial<Dictionary["schoolSettings"]["domain"]> =
    dictionary?.schoolSettings?.domain ?? {}
  const statusLabels = t.status as Record<string, string> | undefined
  const { locale } = useLocale()
  const [isPending, startTransition] = useTransition()
  const [domain, setDomain] = useState("")
  const [notes, setNotes] = useState("")
  const [touched, setTouched] = useState(false)

  const address = `${currentDomain ?? ""}.${LIVE_ROOT_DOMAIN}`
  const current =
    existingRequests.find((r) => r.status === "pending") ??
    existingRequests.find(
      (r) => r.status === "approved" || r.status === "verified"
    )
  const history = existingRequests.filter((r) => r.id !== current?.id)

  const cleaned = domain.trim().toLowerCase()
  const isValid = cleaned.length >= 4 && DOMAIN_RE.test(cleaned)
  const showInvalid = touched && cleaned.length > 0 && !isValid

  const errorText = (code: string | undefined, fallback: string) => {
    if (code === "DOMAIN_REQUEST_PENDING") return t.errors?.pending
    if (code === "ALREADY_EXISTS") return t.errors?.taken
    if (code === "VALIDATION_ERROR")
      return (t.errors?.invalid ?? "").replace("{example}", EXAMPLE)
    return fallback
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouched(true)
    if (!isValid) return
    const formData = new FormData()
    formData.set("domain", cleaned)
    if (notes.trim()) formData.set("notes", notes.trim())

    startTransition(async () => {
      const result = await createDomainRequest(formData)
      if (result.success) {
        SuccessToast(t.submitted ?? "Request sent.")
        setDomain("")
        setNotes("")
        setTouched(false)
      } else {
        ErrorToast(
          errorText(
            "error" in result ? result.error : undefined,
            t.errors?.submit ?? "Couldn't send the request."
          ) ?? "Error"
        )
      }
    })
  }

  const handleCancel = (requestId: string) => {
    startTransition(async () => {
      const result = await cancelDomainRequest(requestId)
      if (result.success) {
        SuccessToast(t.cancelled ?? "Request cancelled.")
      } else {
        ErrorToast(t.errors?.cancel ?? "Couldn't cancel the request.")
      }
    })
  }

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      numberingSystem: "latn",
      calendar: "gregory",
      dateStyle: "medium",
    }).format(new Date(d))

  const requestedOn = (d: Date) =>
    (t.requestedOn ?? "Requested {date}").replace("{date}", formatDate(d))

  const [footerBefore, footerAfter = ""] = (
    t.addressFooter ?? "To change this address, go to {link}."
  ).split("{link}")

  return (
    <div className="space-y-8">
      {/* Your address */}
      <SettingsGroup
        title={t.addressTitle ?? "Your address"}
        footer={
          <>
            {footerBefore}
            <Link
              href={`/${locale}/school/configuration/title`}
              className="text-primary font-medium hover:underline"
            >
              {t.addressFooterLink ?? "School name"}
            </Link>
            {footerAfter}
          </>
        }
      >
        <SettingsRow
          label={
            <bdi dir="ltr" className="block truncate font-mono text-sm">
              {address}
            </bdi>
          }
        >
          <div className="flex items-center gap-1">
            <CopyButton
              value={address}
              label={t.copy ?? "Copy"}
              copiedLabel={t.copied ?? "Copied"}
            />
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={t.open ?? "Open"}
              title={t.open ?? "Open"}
            >
              <a
                href={`https://${address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        </SettingsRow>
      </SettingsGroup>

      {/* Custom domain */}
      {current ? (
        <SettingsGroup title={t.customTitle ?? "Custom domain"}>
          <SettingsRow
            label={
              <bdi dir="ltr" className="font-mono">
                {current.domain}
              </bdi>
            }
            description={requestedOn(current.createdAt)}
          >
            <div className="flex items-center gap-2">
              <StatusPill status={current.status} labels={statusLabels} />
              {current.status === "pending" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleCancel(current.id)}
                  disabled={isPending}
                >
                  {t.cancel ?? "Cancel request"}
                </Button>
              ) : null}
            </div>
          </SettingsRow>
        </SettingsGroup>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <SettingsGroup
            title={t.customTitle ?? "Custom domain"}
            footer={
              showInvalid ? (
                <span className="text-destructive">
                  {withLtr(
                    t.invalidDomain ?? "Enter a domain like {example}.",
                    "example",
                    EXAMPLE
                  )}
                </span>
              ) : (
                withLtr(
                  t.customFooter ?? "Use a domain you own, like {example}.",
                  "example",
                  EXAMPLE
                )
              )
            }
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <Input
                name="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="myschool.com"
                aria-label={t.domainLabel ?? "Domain"}
                aria-invalid={showInvalid || undefined}
                dir="ltr"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="url"
                disabled={isPending}
                className="flex-1 border-0 px-0 text-left font-mono shadow-none focus-visible:ring-0"
              />
              <Button type="submit" size="sm" disabled={isPending || !cleaned}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t.requesting ?? "Sending…"}
                  </>
                ) : (
                  (t.request ?? "Request")
                )}
              </Button>
            </div>
            <div className="px-4 py-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  t.notesPlaceholder ?? "Anything our team should know"
                }
                aria-label={t.notesLabel ?? "Notes (optional)"}
                rows={2}
                maxLength={500}
                disabled={isPending}
                className="min-h-0 resize-none border-0 px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </SettingsGroup>
        </form>
      )}

      {/* DNS steps once approved */}
      {current && current.status === "approved" ? (
        <SettingsGroup title={t.dnsTitle ?? "Connect your domain"}>
          <ol className="space-y-4 px-4 py-4 text-sm">
            <Step n={1}>{t.dnsStep1}</Step>
            <Step n={2}>
              <div className="space-y-2">
                <p>{t.dnsStep2}</p>
                <div className="bg-muted/50 divide-border/60 divide-y rounded-xl border">
                  {[
                    { label: t.dnsType ?? "Type", value: "CNAME" },
                    { label: t.dnsName ?? "Name", value: "www" },
                    { label: t.dnsValue ?? "Value", value: address },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <span className="text-muted-foreground w-16 shrink-0 text-xs">
                        {r.label}
                      </span>
                      <bdi
                        dir="ltr"
                        className="min-w-0 flex-1 truncate text-start font-mono text-xs"
                      >
                        {r.value}
                      </bdi>
                      <CopyButton
                        value={r.value}
                        label={t.copy ?? "Copy"}
                        copiedLabel={t.copied ?? "Copied"}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Step>
            <Step n={3}>{t.dnsStep3}</Step>
          </ol>
        </SettingsGroup>
      ) : null}

      {/* History, collapsed */}
      {history.length > 0 ? (
        <Collapsible>
          <CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1 px-4 text-xs font-medium">
            {t.history ?? "Previous requests"}
            <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <SettingsGroup>
              {history.map((r) => (
                <SettingsRow
                  key={r.id}
                  label={
                    <bdi dir="ltr" className="font-mono">
                      {r.domain}
                    </bdi>
                  }
                  description={
                    <>
                      {requestedOn(r.createdAt)}
                      {r.notes ? (
                        <span className="block">
                          <bdi>{r.notes}</bdi>
                        </span>
                      ) : null}
                    </>
                  }
                >
                  <StatusPill status={r.status} labels={statusLabels} />
                </SettingsRow>
              ))}
            </SettingsGroup>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        dir="ltr"
        className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums"
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">{children}</div>
    </li>
  )
}

const PILL: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  approved: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  verified: "bg-green-500/15 text-green-700 dark:text-green-400",
  rejected: "bg-destructive/10 text-destructive",
}

function StatusPill({
  status,
  labels,
}: {
  status: string
  labels?: Record<string, string>
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        PILL[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {labels?.[status] ?? status}
    </span>
  )
}

function CopyButton({
  value,
  label,
  copiedLabel,
}: {
  value: string
  label: string
  copiedLabel: string
}) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8"
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Clipboard blocked (insecure context) — nothing to do.
        }
      }}
    >
      {copied ? (
        <Check className="size-4 text-green-600" />
      ) : (
        <Copy className="size-4" />
      )}
    </Button>
  )
}
