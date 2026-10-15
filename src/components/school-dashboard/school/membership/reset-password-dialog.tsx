"use client"

import { useEffect, useState, useTransition } from "react"
import { useParams } from "next/navigation"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ErrorToast } from "@/components/atom/toast"

import { resetMemberPassword } from "./actions"
import type { MemberRow } from "./columns"
import { fillT } from "./labels"

interface ResetPasswordDialogProps {
  member: MemberRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  t: Record<string, string>
}

type Issued = { username: string; tempPassword: string }

/**
 * Two steps: confirm, then show the freshly minted login once. The server
 * action also delivers it in-app, by email and WhatsApp; the screen copy is
 * for handing it over in person.
 */
export function ResetPasswordDialog({
  member,
  open,
  onOpenChange,
  t,
}: ResetPasswordDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [issued, setIssued] = useState<Issued | null>(null)
  const [copied, setCopied] = useState(false)
  const [loginUrl, setLoginUrl] = useState("")
  const params = useParams<{ lang?: string }>()
  const lang = params?.lang || "ar"

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
        ErrorToast(t.actionFailed)
      }
    })
  }

  const handleCopy = async () => {
    if (!issued) return
    const text = [
      `${t.username}: ${issued.username}`,
      `${t.tempPassword}: ${issued.tempPassword}`,
      loginUrl && `${t.loginUrl}: ${loginUrl}`,
    ]
      .filter(Boolean)
      .join("\n")
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked — the values stay selectable on screen.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {issued ? (
          <>
            <DialogHeader>
              <DialogTitle>{t.resetPasswordDone}</DialogTitle>
              <DialogDescription>
                {t.resetPasswordDoneDescription}
              </DialogDescription>
            </DialogHeader>
            <dl className="bg-muted/50 space-y-3 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground text-sm">{t.username}</dt>
                <dd
                  className="font-mono text-base font-medium tabular-nums select-all"
                  dir="ltr"
                >
                  {issued.username}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground text-sm">
                  {t.tempPassword}
                </dt>
                <dd
                  className="font-mono text-base font-medium tabular-nums select-all"
                  dir="ltr"
                >
                  {issued.tempPassword}
                </dd>
              </div>
            </dl>
            <DialogFooter>
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? t.copied : t.copyCredentials}
              </Button>
              <Button onClick={() => handleOpenChange(false)}>{t.done}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t.resetPassword}</DialogTitle>
              <DialogDescription>
                {fillT(t.resetPasswordDescription ?? "", {
                  name: member?.name ?? "",
                })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleReset} disabled={isPending}>
                {isPending ? t.processing : t.resetPassword}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
