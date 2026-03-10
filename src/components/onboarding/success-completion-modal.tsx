"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react"
import confetti from "canvas-confetti"
import { Check, Copy } from "lucide-react"

import { Modal } from "@/components/atom/modal"

interface SuccessCompletionModalProps {
  schoolData: {
    name: string
    domain: string
    id: string
  }
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
  onGoToDashboard: () => void
}

export default function SuccessCompletionModal({
  schoolData,
  showModal,
  setShowModal,
  onGoToDashboard,
}: SuccessCompletionModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (showModal) {
      // Trigger confetti animation
      const count = 200
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 100000,
      }

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
          spread: 90,
          scalar: 1.2,
          colors: ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"],
        })
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      })

      fire(0.2, {
        spread: 60,
      })

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      })

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      })

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      })
    }
  }, [showModal])

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "databayt.org"
  const fullDomain = `${schoolData.domain}.${rootDomain}`

  const handleCopy = useCallback(() => {
    const info = [
      `School: ${schoolData.name}`,
      `URL: ${fullDomain}`,
      `Admin: Your current login email`,
      `Password: Your current password`,
    ].join("\n")

    navigator.clipboard.writeText(info).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [schoolData.name, fullDomain])

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="md:max-w-lg"
      preventDefaultClose={false}
    >
      <div className="p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h2 className="mb-4">Congratulations!</h2>

        <p className="text-muted-foreground mb-2">
          Your school has been successfully created at
        </p>

        <h5 className="text-primary mb-6">{fullDomain}</h5>

        {/* Essential Info Card */}
        <div className="bg-muted/50 mx-auto mb-6 rounded-lg border p-4 text-start">
          <div className="mb-3 flex items-center justify-between">
            <small className="text-muted-foreground font-medium">
              Save your school details
            </small>
            <button
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">School</span>
              <span className="font-medium">{schoolData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">URL</span>
              <span className="font-medium">{fullDomain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admin</span>
              <span className="font-medium">Your login email</span>
            </div>
          </div>
        </div>

        {/* Action Link */}
        <button
          onClick={onGoToDashboard}
          className="text-primary underline transition-all hover:no-underline"
        >
          Go to Dashboard
        </button>
      </div>
    </Modal>
  )
}
