"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { useParams } from "next/navigation"
import confetti from "canvas-confetti"
import { Check, Copy, Globe, Loader2 } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

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
import { CredentialsPrint, type PrintLabels } from "./credentials-print"
import { CredentialsShare, type ShareLabels } from "./credentials-share"
import { HandLock } from "./hand-lock"

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
  const [printOpen, setPrintOpen] = useState(false)
  // Derived once on mount; window/location are not available during SSR.
  const [hostInfo, setHostInfo] = useState<{
    schoolName: string
    loginUrl: string
  }>({ schoolName: "", loginUrl: "" })

  const params = useParams<{ lang?: string }>()
  const lang = params?.lang || "en"
  const reduce = useReducedMotion()
  const lastConfettiKeyRef = useRef<string | null>(null)

  const t = (dictionary as any)?.credentials as
    | Record<string, string>
    | undefined

  useEffect(() => {
    if (typeof window === "undefined") return
    const host = window.location.hostname
    // Subdomain (e.g. "kingfahad" from "kingfahad.databayt.org") doubles as
    // the school identity — humanize it for the print sheet header.
    const subdomain = host.split(".")[0] || host
    const schoolName =
      subdomain.charAt(0).toUpperCase() + subdomain.slice(1).toLowerCase()
    const loginUrl = `${window.location.origin}/${lang}/login`
    setHostInfo({ schoolName, loginUrl })
  }, [lang])

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

  // Confetti burst — only when fresh credentials land (newly created or just
  // reset), only once per studentId per open session, never under reduced
  // motion, never on existing-user views (where the password is hidden).
  useEffect(() => {
    if (!open || !credentials || !credentials.isNew || !credentials.password) {
      return
    }
    const key = studentId ?? credentials.username
    if (lastConfettiKeyRef.current === key) return
    lastConfettiKeyRef.current = key
    if (reduce) return

    const palette = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#06B6D4"]
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 35,
      origin: { y: 0.35 },
      zIndex: 100001,
      colors: palette,
    })
  }, [open, credentials, studentId, reduce])

  // Reset the confetti guard when the dialog fully closes so the next
  // open-with-isNew gets its burst.
  useEffect(() => {
    if (!open) lastConfettiKeyRef.current = null
  }, [open])

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

  const shareLabels: ShareLabels = {
    copyAll: t?.copyAll || "Copy all details",
    copied: t?.copiedToClipboard || "Copied to clipboard",
    share: t?.share || "Share",
    whatsapp: t?.whatsapp || "WhatsApp",
    email: t?.shareEmail || "Email",
    sms: t?.shareSms || "SMS",
    print: t?.print || "Print",
    messageTemplate:
      t?.shareMessage ||
      "Login for {studentName}\n\nUsername: {username}\nPassword: {password}\nLogin at: {loginUrl}\n\nThe student will be asked to change the password on first login.",
    emailSubject: t?.shareEmailSubject || "Login credentials for {studentName}",
  }

  const printLabels: PrintLabels = {
    printTitle: t?.printTitle || "Login Credentials",
    printGenerated: t?.printGenerated || "Generated",
    printInstructions:
      t?.printInstructions ||
      "Please keep this document secure. {studentName} will be asked to change the password on first login.",
    username: t?.username || "Username",
    password: t?.password || "Password",
    loginUrl: t?.loginUrl || "Login URL",
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="overflow-hidden sm:max-w-md">
          {/* Decorative gradient + blur orbs — non-interactive, behind content */}
          <div
            aria-hidden="true"
            className="from-primary/5 via-background to-secondary/5 pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br"
          />
          <div
            aria-hidden="true"
            className="bg-primary/10 pointer-events-none absolute -end-16 -top-16 -z-10 h-32 w-32 rounded-full blur-3xl"
          />
          <div
            aria-hidden="true"
            className="bg-secondary/10 pointer-events-none absolute -start-16 -bottom-16 -z-10 h-32 w-32 rounded-full blur-3xl"
          />

          <motion.div
            initial={
              reduce
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.96, y: 8 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: reduce ? 0 : 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative"
          >
            <DialogHeader className="items-center text-center">
              <motion.div
                initial={reduce ? { scale: 1 } : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        bounce: 0.5,
                        duration: 0.6,
                        delay: 0.1,
                      }
                }
                className="text-foreground mx-auto mb-2 h-24 w-24"
              >
                <HandLock className="h-full w-full" />
              </motion.div>
              <DialogTitle className="text-center">{studentName}</DialogTitle>
              <DialogDescription className="text-center">
                {description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4" aria-live="polite">
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
                          aria-label={t?.copyAll || "Copy"}
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
                            onClick={() =>
                              handleCopy(credentials.email!, "email")
                            }
                            aria-label={t?.copyAll || "Copy"}
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
                          <Input
                            value={credentials.password}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() =>
                              handleCopy(credentials.password!, "password")
                            }
                            aria-label={t?.copyAll || "Copy"}
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

                    {hostInfo.loginUrl && (
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                          {t?.loginUrl || "Login URL"}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={hostInfo.loginUrl}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() =>
                              handleCopy(hostInfo.loginUrl, "loginUrl")
                            }
                            aria-label={t?.copyAll || "Copy"}
                          >
                            {copiedField === "loginUrl" ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {credentials.password && (
                    <p className="text-muted-foreground text-xs">
                      {t?.mustChangePassword ||
                        "The student will be asked to change their password on first login."}
                    </p>
                  )}

                  {/* Share strip — primary handover affordance */}
                  <CredentialsShare
                    credentials={credentials}
                    studentName={studentName}
                    loginUrl={hostInfo.loginUrl}
                    labels={shareLabels}
                    onPrint={() => setPrintOpen(true)}
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
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
                    <Button size="sm" onClick={() => handleOpenChange(false)}>
                      {t?.done || "Done"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {credentials?.password && (
        <CredentialsPrint
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          schoolName={hostInfo.schoolName}
          studentName={studentName}
          username={credentials.username}
          password={credentials.password}
          loginUrl={hostInfo.loginUrl}
          lang={lang}
          labels={printLabels}
        />
      )}
    </>
  )
}
