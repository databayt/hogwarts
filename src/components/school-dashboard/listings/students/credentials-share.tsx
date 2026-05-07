"use client"

// Share strip for the credentials dialog. The admin's primary goal here is to
// hand the credentials to the student / father / mother — usually over
// WhatsApp in the Saudi context, sometimes email, sometimes printed. We expose
// every channel as a single click; the actual contact is picked in the user's
// own app, so we never read parent contact info from the database.
//
// Channels:
//   - WhatsApp    : https://wa.me/?text=… (web + mobile WA)
//   - Email       : mailto: with subject + body
//   - SMS         : sms:?body=… (mobile only — matchMedia coarse pointer)
//   - Web Share   : navigator.share when available (collapses many channels)
//   - Print       : delegates to the parent dialog (which renders the print sheet)
//
// Clipboard copy is owned by the dialog body itself (a quieter inline trigger
// below the credentials list), so this strip is purely "send via channel".
import { useEffect, useState } from "react"
import {
  Mail,
  MessageCircle,
  MessageSquare,
  Printer,
  Share2,
} from "lucide-react"

import { Button } from "@/components/ui/button"

export interface ShareLabels {
  share: string
  whatsapp: string
  email: string
  sms: string
  print: string
  /** Template tokens: {studentName} {username} {password} {loginUrl} */
  messageTemplate: string
  /** Template token: {studentName} */
  emailSubject: string
}

interface CredentialsShareProps {
  credentials: {
    username: string
    password: string | null
    email: string | null
  }
  studentName: string
  loginUrl: string
  labels: ShareLabels
  onPrint: () => void
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.split(`{${k}}`).join(v),
    template
  )
}

export function CredentialsShare({
  credentials,
  studentName,
  loginUrl,
  labels,
  onPrint,
}: CredentialsShareProps) {
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)

  // Probe capabilities on the client to avoid hydration drift between
  // server-rendered and browser-rendered button sets.
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator)
    if (typeof window !== "undefined") {
      setIsCoarsePointer(window.matchMedia("(pointer: coarse)").matches)
    }
  }, [])

  const hasPassword = !!credentials.password
  const message = fillTemplate(labels.messageTemplate, {
    studentName,
    username: credentials.username,
    password: credentials.password ?? "",
    loginUrl,
  })
  const subject = fillTemplate(labels.emailSubject, { studentName })

  // sms:?& covers both iOS (?body=) and Android (?&body=) URL syntaxes
  const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`
  const mailHref = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
  const smsHref = `sms:?&body=${encodeURIComponent(message)}`

  async function nativeShare() {
    if (!hasPassword) return
    try {
      await navigator.share({ title: subject, text: message })
    } catch {
      // user dismissed or the call was aborted — no-op
    }
  }

  // Existing-user / self-onboarded view: no password to share, only Print
  if (!hasPassword) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrint}
          className="gap-1.5"
        >
          <Printer className="h-4 w-4" />
          <span>{labels.print}</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={labels.whatsapp}
        >
          <MessageCircle className="h-4 w-4 text-green-600" />
          <span>{labels.whatsapp}</span>
        </a>
      </Button>

      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <a href={mailHref} aria-label={labels.email}>
          <Mail className="h-4 w-4" />
          <span>{labels.email}</span>
        </a>
      </Button>

      {isCoarsePointer && (
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a href={smsHref} aria-label={labels.sms}>
            <MessageSquare className="h-4 w-4" />
            <span>{labels.sms}</span>
          </a>
        </Button>
      )}

      {canNativeShare && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={nativeShare}
          className="gap-1.5"
        >
          <Share2 className="h-4 w-4" />
          <span>{labels.share}</span>
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onPrint}
        className="gap-1.5"
      >
        <Printer className="h-4 w-4" />
        <span>{labels.print}</span>
      </Button>
    </div>
  )
}
