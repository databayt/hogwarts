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

import { generateStudentCredentials } from "./actions"

interface CredentialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string | null
  studentName: string
}

export function CredentialsDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
}: CredentialsDialogProps) {
  const [credentials, setCredentials] = useState<{
    email: string
    password: string
    isNew: boolean
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleGenerate = useCallback(() => {
    if (!studentId) return
    setError(null)
    setCredentials(null)
    startTransition(async () => {
      const result = await generateStudentCredentials({ studentId })
      if (result.success && result.data) {
        setCredentials(result.data)
      } else {
        setError(
          "error" in result
            ? (result.error ?? "Failed to generate credentials")
            : "Failed to generate credentials"
        )
      }
    })
  }, [studentId])

  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Fallback for environments without clipboard API
    }
  }, [])

  // Auto-generate when dialog opens
  useEffect(() => {
    if (open && studentId && !credentials && !isPending) {
      handleGenerate()
    }
  }, [open, studentId, credentials, isPending, handleGenerate])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setCredentials(null)
        setError(null)
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{studentName}</DialogTitle>
          <DialogDescription>
            {credentials?.isNew
              ? "New login account created. Share these credentials with the student."
              : credentials
                ? "Password has been reset. Share the new password with the student."
                : "Generating login credentials..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isPending && (
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
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
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
                  <Label>Password</Label>
                  <div className="flex gap-2">
                    <Input value={credentials.password} readOnly />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        handleCopy(credentials.password, "password")
                      }
                    >
                      {copiedField === "password" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-xs">
                The student will be asked to change their password on first
                login.
              </p>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isPending}
                >
                  Reset Password
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
