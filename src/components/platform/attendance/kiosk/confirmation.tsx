/**
 * Kiosk Confirmation
 *
 * Displays student info and confirms check-in/out action.
 */
"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

import type { KioskAction } from "./validation"

interface StudentInfo {
  id: string
  name: string
  photoUrl?: string | null
  grNumber?: string | null
  yearLevel?: string
}

interface KioskConfirmationProps {
  student: StudentInfo
  action: KioskAction
  onConfirm: () => void
  onCancel: () => void
  locale: string
}

export function KioskConfirmation({
  student,
  action,
  onConfirm,
  onCancel,
  locale,
}: KioskConfirmationProps) {
  const isRTL = locale === "ar"
  const isCheckIn = action === "CHECK_IN"

  return (
    <div className="flex w-full max-w-md flex-col items-center text-center">
      {/* Student photo */}
      <div className="border-primary mb-6 h-32 w-32 overflow-hidden rounded-full border-4">
        {student.photoUrl ? (
          <Image
            src={student.photoUrl}
            alt={student.name}
            width={128}
            height={128}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <svg
              className="text-muted-foreground h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Student info */}
      <h2 className="mb-2 text-3xl font-bold">{student.name}</h2>

      {student.grNumber && (
        <p className="text-muted-foreground mb-1 text-lg">
          {isRTL ? "رقم التسجيل:" : "ID:"} {student.grNumber}
        </p>
      )}

      {student.yearLevel && (
        <p className="text-muted-foreground mb-6 text-lg">
          {isRTL ? "المستوى:" : "Level:"} {student.yearLevel}
        </p>
      )}

      {/* Action indicator */}
      <div
        className={cn(
          "mb-8 rounded-full px-6 py-3",
          isCheckIn
            ? "bg-green-100 text-green-700"
            : "bg-orange-100 text-orange-700"
        )}
      >
        <span className="text-xl font-semibold">
          {isCheckIn
            ? isRTL
              ? "تسجيل حضور"
              : "Check In"
            : isRTL
              ? "تسجيل انصراف"
              : "Check Out"}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex w-full gap-4">
        <button
          onClick={onCancel}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1 rounded-xl py-4 text-lg font-medium transition-colors"
        >
          {isRTL ? "إلغاء" : "Cancel"}
        </button>

        <button
          onClick={onConfirm}
          className={cn(
            "flex-1 rounded-xl py-4 text-lg font-medium transition-colors",
            isCheckIn
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-orange-600 text-white hover:bg-orange-700"
          )}
        >
          {isRTL ? "تأكيد" : "Confirm"}
        </button>
      </div>

      {/* Not you? link */}
      <button
        onClick={onCancel}
        className="text-muted-foreground hover:text-foreground mt-6 text-sm underline transition-colors"
      >
        {isRTL ? "لست أنت؟ أعد المسح" : "Not you? Scan again"}
      </button>
    </div>
  )
}
