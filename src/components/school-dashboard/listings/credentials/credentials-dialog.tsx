"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Minimal, role-agnostic credentials dialog: the 6-digit username and 4-digit
// PIN, a Copy icon and one icon per share channel. When the password can't be
// shown (a student who chose their own), "Reset password" is the admin's
// recovery path — it always works.
//
// Steadiness: the layout is fixed. The Share affordance is always the same <a>
// element (it just gains/loses an href once credentials load) — no element
// swap, no caption text that grows/shrinks — so the centered dialog never
// re-centers/bounces. Credentials generate once per open in the background.
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from "react"
import dynamic from "next/dynamic"
import { useParams } from "next/navigation"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { generateCredentials } from "./actions"
import { EmailIcon, MessageIcon, WhatsAppIcon } from "./icons"
import { fillTemplate, normalizePhone } from "./share"
import {
  closeCredentialsDialog,
  getStore,
  setCachedCredentials,
  setStore,
  useCredentialsDialogState,
} from "./store"
import type { CredentialsPayload } from "./types"

// The dialog's hero animation (lottie-react + motion) loads with the dialog.
// Statically imported, lottie sat in the initial JS of the students and
// teachers tables — every visit, for a dialog opened a few times a term.
const HandLock = dynamic(() => import("./hand-lock").then((m) => m.HandLock), {
  ssr: false,
})

interface CredentialsDialogProps {
  /** The `school.students.credentials` dictionary block (shared by all roles). */
  labels?: Record<string, string>
  /** Called after the dialog closes — wire to `router.refresh()` so the
   *  listing reflects the new "has account" state. */
  onClosed?: () => void
}

export function CredentialsDialog({
  labels,
  onClosed,
}: CredentialsDialogProps) {
  const {
    open,
    name: listedName,
    badge,
    credentials,
  } = useCredentialsDialogState()
  // Listings show the school's short name; a login is handed over under the
  // person's full name.
  const name = credentials?.fullName || listedName
  const [copied, setCopied] = useState(false)
  const [loginUrl, setLoginUrl] = useState("")

  const params = useParams<{ lang?: string }>()
  const lang = params?.lang || "en"

  const t = labels
  const tr = useCallback(
    (key: string, fallback: string) => t?.[key] || fallback,
    [t]
  )

  // Login URL — derived once on the client (window not available during SSR).
  useEffect(() => {
    if (typeof window === "undefined") return
    setLoginUrl(`${window.location.origin}/${lang}/login`)
  }, [lang])

  // Single in-flight generate per open, cached on a ref so re-renders and an
  // early icon click share one server round-trip. Cleared on close.
  const loadRef = useRef<{
    id: string
    promise: Promise<CredentialsPayload | null>
  } | null>(null)
  // Only refresh the listing on close if we actually minted a NEW account this
  // session — otherwise every close triggered a full route refresh (the page
  // "reload" the admin saw each time).
  const mintedNewRef = useRef(false)

  const ensureCredentials =
    useCallback(async (): Promise<CredentialsPayload | null> => {
      const s = getStore()
      if (s.credentials) return s.credentials
      if (!s.role || !s.id) return null
      if (loadRef.current?.id === s.id) return loadRef.current.promise

      const role = s.role
      const id = s.id
      setStore({ isLoading: true, error: null })
      const promise = (async () => {
        const result = await generateCredentials({ role, id })
        if (getStore().id !== id) return null // stale: switched/closed
        if (result.success && result.data) {
          setStore({ isLoading: false, credentials: result.data })
          setCachedCredentials(role, id, result.data)
          if (result.data.isNew) mintedNewRef.current = true
          return result.data
        }
        setStore({
          isLoading: false,
          error:
            ("error" in result && result.error) ||
            tr("failedToGenerate", "Failed to load credentials"),
        })
        return null
      })()
      loadRef.current = { id, promise }
      return promise
    }, [tr])

  // Prefetch on open so the icons are live by the time the admin clicks.
  useEffect(() => {
    if (open && !credentials) ensureCredentials()
  }, [open, credentials, ensureCredentials])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        loadRef.current = null
        setCopied(false)
        closeCredentialsDialog()
        // Refresh the listing only when a brand-new account was created — not
        // on every close (which caused a full-page reload each time).
        if (mintedNewRef.current) {
          mintedNewRef.current = false
          onClosed?.()
        }
      }
    },
    [onClosed]
  )

  const buildClipboardText = useCallback(
    (creds: CredentialsPayload) => {
      const lines: string[] = [
        `${tr("username", "Username")}: ${creds.username}`,
      ]
      if (creds.email) lines.push(`${tr("email", "Email")}: ${creds.email}`)
      if (creds.password)
        lines.push(`${tr("password", "Password")}: ${creds.password}`)
      if (loginUrl) lines.push(`${tr("loginUrl", "Login URL")}: ${loginUrl}`)
      return lines.join("\n")
    },
    [loginUrl, tr]
  )

  const handleCopy = useCallback(async () => {
    const creds = await ensureCredentials()
    if (!creds) return
    try {
      await navigator.clipboard.writeText(buildClipboardText(creds))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked — Share is the fallback.
    }
  }, [ensureCredentials, buildClipboardText])

  // Always render all three contact channels; the ones with no contact on file
  // are disabled. Keeping the count constant means the icon row never shifts
  // when credentials load. WhatsApp + SMS need a phone; Email needs an email.
  const channels = useMemo(() => {
    const phone = credentials ? normalizePhone(credentials.phone) : null
    const email = credentials?.email ?? null

    let waHref: string | undefined
    let mailHref: string | undefined
    let smsHref: string | undefined
    if (credentials) {
      const message = fillTemplate(
        tr(
          "shareMessage",
          "Login for {studentName}\n\nUsername: {username}\nPassword: {password}\nLogin at: {loginUrl}"
        ),
        {
          studentName: name,
          name,
          username: credentials.username,
          password: credentials.password ?? "",
          loginUrl,
        }
      )
      const subject = fillTemplate(
        tr("shareEmailSubject", "Login credentials for {studentName}"),
        { studentName: name, name }
      )
      if (phone) {
        waHref = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        smsHref = `sms:${phone}?&body=${encodeURIComponent(message)}`
      }
      if (email) {
        mailHref = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(message)}`
      }
    }

    const list: Array<{
      key: string
      href?: string
      enabled: boolean
      label: string
      external?: boolean
      Icon: ComponentType<SVGProps<SVGSVGElement>>
    }> = [
      {
        key: "whatsapp",
        href: waHref,
        enabled: !!waHref,
        label: tr("whatsapp", "WhatsApp"),
        external: true,
        Icon: WhatsAppIcon,
      },
      {
        key: "email",
        href: mailHref,
        enabled: !!mailHref,
        label: tr("shareEmail", "Email"),
        Icon: EmailIcon,
      },
      {
        key: "sms",
        href: smsHref,
        enabled: !!smsHref,
        label: tr("shareSms", "SMS"),
        Icon: MessageIcon,
      },
    ]
    return list
  }, [credentials, name, loginUrl, tr])

  const copyLabel = tr("copyDetails", "Copy details to clipboard")

  // Recovery: mint a new PIN for an account whose password isn't shown.
  const [resetting, setResetting] = useState(false)
  const handleReset = useCallback(async () => {
    const s = getStore()
    if (!s.role || !s.id) return
    const { role, id } = s
    setResetting(true)
    const result = await generateCredentials({ role, id, reset: true })
    setResetting(false)
    if (getStore().id !== id) return
    if (result.success && result.data) {
      setStore({ credentials: result.data, error: null })
      setCachedCredentials(role, id, result.data)
    } else {
      setStore({
        error:
          ("error" in result && result.error) ||
          tr("failedToReset", "Failed to reset password"),
      })
    }
  }, [tr])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader className="items-center text-center">
          <div className="text-foreground mx-auto mb-1 h-20 w-20">
            <HandLock className="h-full w-full" />
          </div>
          <DialogTitle className="flex flex-wrap items-center justify-center gap-2 text-center">
            {/* Full name, isolated so an English name in an Arabic dialog
                (or the reverse) never reorders. */}
            <bdi dir="auto">{name}</bdi>
            {badge && (
              <Badge variant="secondary" className="font-normal">
                {badge}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-center">
            {tr("copyOrShare", "Copy or share the login credentials.")}
          </DialogDescription>
        </DialogHeader>

        {/* Start-aligned two-row grid: labels in col 1, values in col 2, both
            anchored to the start. Fixed rows keep the dialog height constant. */}
        <dl className="mx-auto grid w-full max-w-[16rem] grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 text-start">
          <dt className="text-muted-foreground text-xs">
            {tr("username", "Username")}
          </dt>
          <dd className="font-mono text-base tracking-wider break-all">
            <bdi dir="ltr">{credentials?.username ?? "—"}</bdi>
          </dd>
          <dt className="text-muted-foreground text-xs">
            {tr("password", "Password")}
          </dt>
          <dd className="font-mono text-base tracking-wider break-all">
            <bdi dir="ltr">{credentials?.password ?? "—"}</bdi>
          </dd>
        </dl>

        {credentials && !credentials.password ? (
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="text-muted-foreground hover:text-foreground mx-auto text-xs underline underline-offset-4 disabled:opacity-50"
          >
            {resetting
              ? tr("resettingPassword", "Resetting password...")
              : tr("resetPassword", "Reset Password")}
          </button>
        ) : (
          <p className="text-muted-foreground text-center text-xs">
            {tr(
              "mustChangePassword",
              "They will be asked to change the password on first login."
            )}
          </p>
        )}

        <div className="flex items-center justify-center gap-5 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copyLabel}
            title={copyLabel}
            className="text-foreground rounded-md p-1 transition-opacity hover:opacity-60"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" strokeWidth={1.5} />
            ) : (
              <Copy className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>

          {channels.map((c) => (
            <a
              key={c.key}
              href={c.href}
              target={c.external ? "_blank" : undefined}
              rel="noopener noreferrer"
              aria-label={c.label}
              title={c.label}
              aria-disabled={!c.enabled}
              className={cn(
                "text-foreground rounded-md p-1 transition-opacity hover:opacity-60",
                !c.enabled && "pointer-events-none opacity-40"
              )}
            >
              <c.Icon className="h-6 w-6" />
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
