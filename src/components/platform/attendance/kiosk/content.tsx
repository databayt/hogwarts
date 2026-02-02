/**
 * Kiosk Content
 *
 * Main content component for self-service attendance kiosk.
 * Handles the kiosk flow: idle → scan/input → confirmation.
 */
"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import type { KioskSession } from "@prisma/client"

import { cn } from "@/lib/utils"

import { lookupStudent, processKioskCheck, registerKiosk } from "./actions"
import { KioskConfirmation } from "./confirmation"
import { KioskKeypad } from "./keypad"
import { KioskReasons } from "./reasons"
import { KioskScanner } from "./scanner"
import type { KioskAction, KioskMethod } from "./validation"

type KioskState =
  | "idle"
  | "scanning"
  | "manual_entry"
  | "student_found"
  | "reason_required"
  | "processing"
  | "success"
  | "error"

interface StudentInfo {
  id: string
  name: string
  photoUrl?: string | null
  grNumber?: string | null
  yearLevel?: string
  lastAction?: KioskAction
  isLate?: boolean
  isEarlyDeparture?: boolean
}

interface KioskContentProps {
  schoolId: string
  schoolName: string
  schoolLogo?: string | null
  kioskId?: string
  kioskSession: KioskSession | null
  locale: string
}

export function KioskContent({
  schoolId,
  schoolName,
  schoolLogo,
  kioskId: initialKioskId,
  kioskSession,
  locale,
}: KioskContentProps) {
  const isRTL = locale === "ar"

  // Kiosk state
  const [state, setState] = useState<KioskState>("idle")
  const [kioskId, setKioskId] = useState(initialKioskId || "")
  const [isRegistered, setIsRegistered] = useState(!!kioskSession)

  // Student state
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [action, setAction] = useState<KioskAction>("CHECK_IN")
  const [method, setMethod] = useState<KioskMethod>("BARCODE")

  // Error state
  const [errorMessage, setErrorMessage] = useState("")

  // Time display
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Reset to idle after timeout
  useEffect(() => {
    if (state === "success" || state === "error") {
      const timer = setTimeout(() => {
        resetKiosk()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [state])

  const resetKiosk = useCallback(() => {
    setState("idle")
    setStudent(null)
    setAction("CHECK_IN")
    setErrorMessage("")
  }, [])

  // Handle student lookup from scan or manual entry
  const handleStudentLookup = async (
    identifierValue: string,
    lookupMethod: KioskMethod
  ) => {
    setState("processing")
    setMethod(lookupMethod)

    try {
      const result = await lookupStudent({
        identifierValue,
        method: lookupMethod,
        schoolId,
      })

      if (!result.success || !result.student) {
        setState("error")
        setErrorMessage(result.error || "Student not found")
        return
      }

      setStudent({
        id: result.student.id,
        name: result.student.name,
        photoUrl: result.student.photoUrl,
        grNumber: result.student.grNumber,
        yearLevel: result.student.yearLevel,
        lastAction: result.student.lastAction as KioskAction | undefined,
        isLate: result.isLate,
        isEarlyDeparture: result.isEarlyDeparture,
      })

      // Determine action based on last action
      const nextAction: KioskAction =
        result.student.lastAction === "CHECK_IN" ? "CHECK_OUT" : "CHECK_IN"
      setAction(nextAction)

      // Check if reason is required
      if (
        (nextAction === "CHECK_IN" && result.isLate) ||
        (nextAction === "CHECK_OUT" && result.isEarlyDeparture)
      ) {
        setState("reason_required")
      } else {
        setState("student_found")
      }
    } catch (error) {
      setState("error")
      setErrorMessage("Failed to look up student")
    }
  }

  // Handle check-in/out with optional reason
  const handleConfirmAction = async (
    reasonCode?: string,
    reasonNote?: string
  ) => {
    if (!student || !kioskId) return

    setState("processing")

    try {
      const result = await processKioskCheck({
        kioskId,
        studentId: student.id,
        action,
        method,
        reasonCode,
        reasonNote,
        schoolId,
      })

      if (result.success) {
        setState("success")
      } else {
        setState("error")
        setErrorMessage(result.error || "Failed to process check-in/out")
      }
    } catch (error) {
      setState("error")
      setErrorMessage("An error occurred")
    }
  }

  // Handle kiosk registration
  const handleRegisterKiosk = async (newKioskId: string, kioskName: string) => {
    try {
      const result = await registerKiosk({
        kioskId: newKioskId,
        kioskName,
        schoolId,
      })

      if (result.success) {
        setKioskId(newKioskId)
        setIsRegistered(true)
      } else {
        setErrorMessage(result.error || "Failed to register kiosk")
      }
    } catch (error) {
      setErrorMessage("Failed to register kiosk")
    }
  }

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Kiosk registration screen
  if (!isRegistered) {
    return (
      <div className="from-primary/10 to-background flex h-full flex-col items-center justify-center bg-gradient-to-b p-8">
        <div className="bg-card w-full max-w-md space-y-6 rounded-xl border p-8 shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {isRTL ? "تسجيل الكشك" : "Kiosk Registration"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isRTL
                ? "أدخل معرف الكشك واسمه للبدء"
                : "Enter kiosk ID and name to begin"}
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.currentTarget
              const id = (
                form.elements.namedItem("kioskId") as HTMLInputElement
              ).value
              const name = (
                form.elements.namedItem("kioskName") as HTMLInputElement
              ).value
              handleRegisterKiosk(id, name)
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium">
                {isRTL ? "معرف الكشك" : "Kiosk ID"}
              </label>
              <input
                name="kioskId"
                type="text"
                required
                className="border-input bg-background mt-1 w-full rounded-lg border p-3 text-lg"
                placeholder={isRTL ? "مثال: KIOSK-001" : "e.g., KIOSK-001"}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {isRTL ? "اسم الكشك" : "Kiosk Name"}
              </label>
              <input
                name="kioskName"
                type="text"
                required
                className="border-input bg-background mt-1 w-full rounded-lg border p-3 text-lg"
                placeholder={
                  isRTL ? "مثال: المدخل الرئيسي" : "e.g., Main Entrance"
                }
              />
            </div>
            {errorMessage && (
              <p className="text-destructive text-sm">{errorMessage}</p>
            )}
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg p-4 text-lg font-medium transition-colors"
            >
              {isRTL ? "تسجيل الكشك" : "Register Kiosk"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="from-primary/5 to-background relative flex h-full flex-col bg-gradient-to-b">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          {schoolLogo && (
            <Image
              src={schoolLogo}
              alt={schoolName}
              width={48}
              height={48}
              className="rounded-lg"
            />
          )}
          <div>
            <h1 className="text-xl font-bold">{schoolName}</h1>
            <p className="text-muted-foreground text-sm">
              {isRTL ? "كشك الحضور الذاتي" : "Self-Service Attendance Kiosk"}
            </p>
          </div>
        </div>
        <div className="text-end">
          <p className="text-3xl font-bold tabular-nums">
            {formatTime(currentTime)}
          </p>
          <p className="text-muted-foreground text-sm">
            {formatDate(currentTime)}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-8">
        {/* Idle State - Show scan prompt */}
        {state === "idle" && (
          <div className="text-center">
            <div className="bg-primary/10 mx-auto mb-8 flex h-48 w-48 items-center justify-center rounded-full">
              <svg
                className="text-primary h-24 w-24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <h2 className="mb-4 text-4xl font-bold">
              {isRTL ? "امسح بطاقتك" : "Scan Your Card"}
            </h2>
            <p className="text-muted-foreground mb-8 text-xl">
              {isRTL ? "أو اضغط للإدخال اليدوي" : "Or tap for manual entry"}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setState("scanning")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8 py-4 text-lg font-medium transition-colors"
              >
                {isRTL ? "مسح الباركود" : "Scan Barcode"}
              </button>
              <button
                onClick={() => setState("manual_entry")}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl px-8 py-4 text-lg font-medium transition-colors"
              >
                {isRTL ? "إدخال يدوي" : "Manual Entry"}
              </button>
            </div>
          </div>
        )}

        {/* Scanning State */}
        {state === "scanning" && (
          <KioskScanner
            onScan={(value) => handleStudentLookup(value, "BARCODE")}
            onCancel={resetKiosk}
            locale={locale}
          />
        )}

        {/* Manual Entry State */}
        {state === "manual_entry" && (
          <KioskKeypad
            onSubmit={(value) => handleStudentLookup(value, "MANUAL")}
            onCancel={resetKiosk}
            locale={locale}
          />
        )}

        {/* Student Found - Confirm action */}
        {state === "student_found" && student && (
          <KioskConfirmation
            student={student}
            action={action}
            onConfirm={() => handleConfirmAction()}
            onCancel={resetKiosk}
            locale={locale}
          />
        )}

        {/* Reason Required */}
        {state === "reason_required" && student && (
          <KioskReasons
            action={action}
            isLate={student.isLate}
            isEarlyDeparture={student.isEarlyDeparture}
            onSubmit={(reasonCode, reasonNote) =>
              handleConfirmAction(reasonCode, reasonNote)
            }
            onSkip={() => handleConfirmAction()}
            onCancel={resetKiosk}
            locale={locale}
          />
        )}

        {/* Processing State */}
        {state === "processing" && (
          <div className="text-center">
            <div className="border-primary mx-auto mb-8 h-24 w-24 animate-spin rounded-full border-4 border-t-transparent" />
            <h2 className="text-2xl font-bold">
              {isRTL ? "جاري المعالجة..." : "Processing..."}
            </h2>
          </div>
        )}

        {/* Success State */}
        {state === "success" && student && (
          <div className="text-center">
            <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-16 w-16 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-3xl font-bold text-green-600">
              {action === "CHECK_IN"
                ? isRTL
                  ? "تم تسجيل الحضور"
                  : "Checked In"
                : isRTL
                  ? "تم تسجيل الانصراف"
                  : "Checked Out"}
            </h2>
            <p className="text-muted-foreground text-xl">{student.name}</p>
            <p className="text-muted-foreground mt-2">
              {formatTime(currentTime)}
            </p>
          </div>
        )}

        {/* Error State */}
        {state === "error" && (
          <div className="text-center">
            <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-16 w-16 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-3xl font-bold text-red-600">
              {isRTL ? "حدث خطأ" : "Error"}
            </h2>
            <p className="text-muted-foreground text-xl">
              {errorMessage ||
                (isRTL ? "يرجى المحاولة مرة أخرى" : "Please try again")}
            </p>
            <button
              onClick={resetKiosk}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 rounded-xl px-8 py-4 text-lg font-medium transition-colors"
            >
              {isRTL ? "حاول مرة أخرى" : "Try Again"}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-3">
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>
            {isRTL ? "معرف الكشك:" : "Kiosk ID:"} {kioskId}
          </span>
          <span>
            {isRTL
              ? "للمساعدة، تواصل مع الإدارة"
              : "For help, contact administration"}
          </span>
        </div>
      </footer>
    </div>
  )
}
