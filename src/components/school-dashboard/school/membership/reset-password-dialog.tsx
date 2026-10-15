"use client"

// Same look as the students/teachers credentials dialog (hand-lock, name +
// badge, username/PIN grid, copy + share icons) and the same layout before
// and after the reset, so the dialog never jumps. Opening it does nothing; the
// underlined "Reset password" link mints the new login, which the server action
// also delivers in-app, by email and WhatsApp.
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
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
import { ErrorToast } from "@/components/atom/toast"
import {
  EmailIcon,
  MessageIcon,
  WhatsAppIcon,
} from "@/components/school-dashboard/listings/credentials/icons"
import {
  fillTemplate,
  normalizePhone,
} from "@/components/school-dashboard/listings/credentials/share"

import { resetMemberPassword } from "./actions"
import type { MemberRow } from "./columns"
import { roleLabel } from "./labels"

const HandLock = dynamic(
  () =>
    import("@/components/school-dashboard/listings/credentials/hand-lock").then(
      (m) => m.HandLock
    ),
  { ssr: false }
)

interface ResetPasswordDialogProps {
  member: MemberRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The membership dictionary. */
  t: Record<string, string>
  /** `school.students.credentials` — the credentials dialog's labels. */
  labels?: Record<string, string>
}

type Issued = { username: string; tempPassword: string; email: string | null }

export function ResetPasswordDialog({
  member,
  open,
  onOpenChange,
  t,
  labels,
}: ResetPasswordDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [issued, setIssued] = useState<Issued | null>(null)
  const [copied, setCopied] = useState(false)
  const [loginUrl, setLoginUrl] = useState("")
  const params = useParams<{ lang?: string }>()
  const lang = params?.lang || "ar"

  const tr = useCallback(
    (key: string, fallback: string) => labels?.[key] || t[key] || fallback,
    [labels, t]
  )

  useEffect(() => {
    setLoginUrl(`${window.location.origin}/${lang}/login`)
  }, [lang])

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setIssued(null)
      setCopied(false)
    }
    onOpenChange(next)
  }

  const handleReset = () => {
    if (!member) return
    startTransition(async () => {
      const result = await resetMemberPassword({ userId: member.id })
      if (result.success && result.data) {
        setIssued(result.data)
      } else {
        ErrorToast(tr("failedToReset", "Failed to reset password"))
      }
    })
  }

  const name = member?.name ?? ""

  const handleCopy = async () => {
    if (!issued) return
    const text = [
      `${tr("username", "Username")}: ${issued.username}`,
      `${tr("password", "Password")}: ${issued.tempPassword}`,
      loginUrl && `${tr("loginUrl", "Login URL")}: ${loginUrl}`,
    ]
      .filter(Boolean)
      .join("\n")
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked — the share icons are the fallback.
    }
  }

  // All three channels always render; without a login yet, or without the
  // contact on file, they sit disabled — the icon row never shifts.
  const channels = useMemo(() => {
    const phone = issued ? normalizePhone(member?.phone) : null
    const email = issued ? (issued.email ?? member?.email ?? null) : null

    let waHref: string | undefined
    let mailHref: string | undefined
    let smsHref: string | undefined
    if (issued) {
      const message = fillTemplate(
        tr(
          "shareMessage",
          "Login for {studentName}\n\nUsername: {username}\nPassword: {password}\nLogin at: {loginUrl}"
        ),
        {
          studentName: name,
          name,
          username: issued.username,
          password: issued.tempPassword,
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
      label: string
      external?: boolean
      Icon: ComponentType<SVGProps<SVGSVGElement>>
    }> = [
      {
        key: "whatsapp",
        href: waHref,
        label: tr("whatsapp", "WhatsApp"),
        external: true,
        Icon: WhatsAppIcon,
      },
      {
        key: "email",
        href: mailHref,
        label: tr("shareEmail", "Email"),
        Icon: EmailIcon,
      },
      {
        key: "sms",
        href: smsHref,
        label: tr("shareSms", "SMS"),
        Icon: MessageIcon,
      },
    ]
    return list
  }, [issued, member, name, loginUrl, tr])

  const copyLabel = tr("copyDetails", "Copy details to clipboard")
  const badge = member ? roleLabel(t, member.role) : ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader className="items-center text-center">
          <div className="text-foreground mx-auto mb-1 h-20 w-20">
            <HandLock className="h-full w-full" />
          </div>
          <DialogTitle className="flex flex-wrap items-center justify-center gap-2 text-center">
            <bdi dir="auto">{name}</bdi>
            {badge && (
              <Badge variant="secondary" className="font-normal">
                {badge}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-center">
            {issued
              ? tr("copyOrShare", "Copy or share the login credentials.")
              : t.resetPasswordDescription}
          </DialogDescription>
        </DialogHeader>

        <dl className="mx-auto grid w-full max-w-[16rem] grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 text-start">
          <dt className="text-muted-foreground text-xs">
            {tr("username", "Username")}
          </dt>
          <dd className="font-mono text-base tracking-wider break-all">
            <bdi dir="ltr">{issued?.username ?? "—"}</bdi>
          </dd>
          <dt className="text-muted-foreground text-xs">
            {tr("password", "Password")}
          </dt>
          <dd className="font-mono text-base tracking-wider break-all">
            <bdi dir="ltr">{issued?.tempPassword ?? "—"}</bdi>
          </dd>
        </dl>

        {issued ? (
          <p className="text-muted-foreground text-center text-xs">
            {tr(
              "mustChangePassword",
              "They will be asked to change the password on first login."
            )}
          </p>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground mx-auto text-xs underline underline-offset-4 disabled:opacity-50"
          >
            {isPending
              ? tr("resettingPassword", "Resetting password...")
              : tr("resetPassword", "Reset Password")}
          </button>
        )}

        <div className="flex items-center justify-center gap-5 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!issued}
            aria-label={copyLabel}
            title={copyLabel}
            className="text-foreground rounded-md p-1 transition-opacity hover:opacity-60 disabled:pointer-events-none disabled:opacity-40"
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
              aria-disabled={!c.href}
              className={cn(
                "text-foreground rounded-md p-1 transition-opacity hover:opacity-60",
                !c.href && "pointer-events-none opacity-40"
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
