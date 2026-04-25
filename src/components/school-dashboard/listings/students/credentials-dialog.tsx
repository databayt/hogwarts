"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
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
  email: string | null
  password: string | null
  isNew: boolean
  isSelfOnboarded: boolean
}

// Module-level store. Survives StudentsTable remounts triggered by Next.js
// server-action revalidation — the server action invoked inside the dialog
// would otherwise unmount the subtree and lose every useState inside it,
// closing the dialog before the admin could read the credentials.
interface DialogStoreState {
  open: boolean
  studentId: string | null
  studentName: string
  credentials: Credentials | null
  error: string | null
  // Hoisted from useTransition so the spinner is visible on the very first
  // render after openCredentialsDialog — without this, the dialog briefly
  // shows an empty body between mount and the first effect-driven fetch.
  isLoading: boolean
  isResetting: boolean
}

const initialStore: DialogStoreState = {
  open: false,
  studentId: null,
  studentName: "",
  credentials: null,
  error: null,
  isLoading: false,
  isResetting: false,
}

let storeState: DialogStoreState = initialStore
const storeListeners = new Set<() => void>()
let inflightStudentId: string | null = null

function notifyStore() {
  storeListeners.forEach((l) => l())
}

function setStore(patch: Partial<DialogStoreState>) {
  storeState = { ...storeState, ...patch }
  notifyStore()
}

function subscribeStore(cb: () => void) {
  storeListeners.add(cb)
  return () => {
    storeListeners.delete(cb)
  }
}

function getStoreSnapshot(): DialogStoreState {
  return storeState
}

function getStoreServerSnapshot(): DialogStoreState {
  return initialStore
}

export function openCredentialsDialog(studentId: string, studentName: string) {
  // Atomically: mark open AND loading, so the first render paints the spinner.
  setStore({
    open: true,
    studentId,
    studentName,
    credentials: null,
    error: null,
    isLoading: true,
    isResetting: false,
  })
}

export function closeCredentialsDialog() {
  inflightStudentId = null
  setStore({
    open: false,
    studentId: null,
    studentName: "",
    credentials: null,
    error: null,
    isLoading: false,
    isResetting: false,
  })
}

export function useCredentialsDialogState(): DialogStoreState {
  return useSyncExternalStore(
    subscribeStore,
    getStoreSnapshot,
    getStoreServerSnapshot
  )
}

interface CredentialsDialogProps {
  dictionary?: Dictionary["school"]["students"]
  onClosed?: () => void
}

export function CredentialsDialog({
  dictionary,
  onClosed,
}: CredentialsDialogProps) {
  const {
    open,
    studentId,
    studentName,
    credentials,
    error,
    isLoading,
    isResetting,
  } = useCredentialsDialogState()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const t = (dictionary as any)?.credentials as
    | Record<string, string>
    | undefined

  const runLoad = useCallback(
    async (targetStudentId: string) => {
      if (inflightStudentId === targetStudentId) return
      inflightStudentId = targetStudentId
      setStore({ isLoading: true, error: null })
      try {
        const result = await getStudentCredentials({
          studentId: targetStudentId,
        })
        // Guard against a stale response arriving after the admin closed or
        // switched students.
        if (storeState.studentId !== targetStudentId) return
        if (result.success && result.data) {
          setStore({
            isLoading: false,
            credentials: result.data as Credentials,
          })
        } else {
          setStore({
            isLoading: false,
            error:
              "error" in result
                ? (result.error ??
                  (t?.failedToGenerate || "Failed to load credentials"))
                : t?.failedToGenerate || "Failed to load credentials",
          })
        }
      } finally {
        if (inflightStudentId === targetStudentId) inflightStudentId = null
      }
    },
    [t]
  )

  const handleReset = useCallback(async () => {
    if (!studentId) return
    setStore({ isResetting: true, error: null })
    const result = await resetStudentPassword({ studentId })
    if (storeState.studentId !== studentId) return
    if (result.success && result.data) {
      setStore({
        isResetting: false,
        credentials: result.data as Credentials,
      })
    } else {
      setStore({
        isResetting: false,
        error:
          "error" in result
            ? (result.error ?? (t?.failedToReset || "Failed to reset password"))
            : t?.failedToReset || "Failed to reset password",
      })
    }
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

  // Auto-load on open. openCredentialsDialog already set isLoading:true, so
  // the spinner is visible before this effect runs — no empty-body flash.
  useEffect(() => {
    if (open && studentId && !credentials && !error) {
      runLoad(studentId)
    }
  }, [open, studentId, credentials, error, runLoad])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        inflightStudentId = null
        setStore({
          open: false,
          studentId: null,
          studentName: "",
          credentials: null,
          error: null,
          isLoading: false,
          isResetting: false,
        })
        onClosed?.()
        return
      }
      setStore({ open: nextOpen })
    },
    [onClosed]
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
              {credentials.isSelfOnboarded ? (
                <div className="bg-muted text-muted-foreground rounded-md p-3 text-xs">
                  {t?.selfOnboarded ||
                    "This student signed up themselves — they log in with email. Username is for reference."}
                </div>
              ) : (
                <div className="bg-muted text-muted-foreground rounded-md p-3 text-xs">
                  {t?.usernameOnly ||
                    "This student logs in with username and password."}
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

                {credentials.email && (
                  <div className="space-y-1.5">
                    <Label>{t?.email || "Email"}</Label>
                    <div className="flex gap-2">
                      <Input value={credentials.email} readOnly />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => handleCopy(credentials.email!, "email")}
                      >
                        {copiedField === "email" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

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
