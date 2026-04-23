"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { Check, Copy, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getStudentCredentials, resetStudentPassword } from "./actions"

interface Credentials {
  username: string
  email: string
  password: string | null
  isNew: boolean
  isSelfOnboarded: boolean
}

interface CredentialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string | null
  studentName: string
  dictionary?: Dictionary["school"]["students"]
  onClosed?: () => void
}

export function CredentialsDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  dictionary,
  onClosed,
}: CredentialsDialogProps) {
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, startLoading] = useTransition()
  const [isResetting, startResetting] = useTransition()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const t = (dictionary as any)?.credentials as
    | Record<string, string>
    | undefined

  const handleLoad = useCallback(() => {
    if (!studentId) return
    setError(null)
    setCredentials(null)
    startLoading(async () => {
      const result = await getStudentCredentials({ studentId })
      if (result.success && result.data) {
        setCredentials(result.data)
      } else {
        setError(
          "error" in result
            ? (result.error ??
                (t?.failedToGenerate || "Failed to load credentials"))
            : t?.failedToGenerate || "Failed to load credentials"
        )
      }
    })
  }, [studentId, t])

  const handleReset = useCallback(() => {
    if (!studentId) return
    setError(null)
    startResetting(async () => {
      const result = await resetStudentPassword({ studentId })
      if (result.success && result.data) {
        setCredentials(result.data)
      } else {
        setError(
          "error" in result
            ? (result.error ?? (t?.failedToReset || "Failed to reset password"))
            : t?.failedToReset || "Failed to reset password"
        )
      }
    })
  }, [studentId, t])

  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Clipboard API unavailable — skip silently
    }
  }, [])

  // Auto-load on open (read-only — never resets an existing password)
  useEffect(() => {
    if (open && studentId && !credentials && !isLoading && !error) {
      handleLoad()
    }
  }, [open, studentId, credentials, isLoading, error, handleLoad])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setCredentials(null)
        setError(null)
        onClosed?.()
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange, onClosed]
  )

  const description = credentials?.isNew
    ? t?.descriptionNew ||
      "New login account created. Share these credentials with the student."
    : credentials?.password
      ? t?.descriptionReset ||
        "Password has been reset. Share the new password with the student."
      : credentials
        ? t?.descriptionExisting ||
          "Current login credentials for this student."
        : isResetting
          ? t?.resettingPassword || "Resetting password..."
          : t?.descriptionGenerating || "Loading login credentials..."

  const passwordHint = credentials?.isSelfOnboarded
    ? t?.passwordHiddenSelfOnboarded ||
      "The student chose this password themselves during sign-up. Reset it only if they've lost access."
    : t?.passwordHidden ||
      'For security, the existing password can\'t be shown. Click "Reset Password" to mint a new one.'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{studentName}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {(isLoading || isResetting) && !credentials && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          {credentials && (
            <>
              {credentials.isSelfOnboarded && (
                <div className="bg-muted text-muted-foreground rounded-md p-3 text-xs">
                  {t?.selfOnboarded ||
                    "This student signed up themselves — they log in with email. Username is for reference."}
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>{t?.username || "Username"}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={credentials.username}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        handleCopy(credentials.username, "username")
                      }
                    >
                      {copiedField === "username" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>{t?.email || "Email"}</Label>
                  <div className="flex gap-2">
                    <Input value={credentials.email} readOnly />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleCopy(credentials.email, "email")}
                    >
                      {copiedField === "email" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>{t?.password || "Password"}</Label>
                  {credentials.password ? (
                    <div className="flex gap-2">
                      <Input value={credentials.password} readOnly />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() =>
                          handleCopy(credentials.password!, "password")
                        }
                      >
                        {copiedField === "password" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      {passwordHint}
                    </p>
                  )}
                </div>
              </div>

              {credentials.password && (
                <p className="text-muted-foreground text-xs">
                  {t?.mustChangePassword ||
                    "The student will be asked to change their password on first login."}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isResetting || isLoading}
                >
                  {isResetting && (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  )}
                  {t?.resetPassword || "Reset Password"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
