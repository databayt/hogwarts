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
import Lottie from "lottie-react"
import { Check, Copy } from "lucide-react"

import { Modal } from "@/components/atom/modal"

interface ApplicationSuccessModalProps {
  applicationNumber: string
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
  isRTL?: boolean
}

export default function ApplicationSuccessModal({
  applicationNumber,
  showModal,
  setShowModal,
  isRTL = false,
}: ApplicationSuccessModalProps) {
  const [copied, setCopied] = useState(false)
  const [animationData, setAnimationData] = useState<object | null>(null)

  useEffect(() => {
    fetch("/animations/confetti.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(console.error)
  }, [])

  const handleCopy = useCallback(() => {
    const info = [
      `${isRTL ? "رقم الطلب" : "Application Number"}: ${applicationNumber}`,
    ].join("\n")

    navigator.clipboard.writeText(info).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [applicationNumber, isRTL])

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="md:max-w-sm"
      preventDefaultClose
    >
      <div className="px-8 py-12 text-center">
        {/* Celebration Animation */}
        <div className="mx-auto mb-4 h-32 w-32">
          {animationData && (
            <Lottie animationData={animationData} loop autoplay />
          )}
        </div>

        {/* Success Message */}
        <p className="text-muted-foreground mb-2">
          {isRTL ? "رقم طلبك هو" : "Your application number is"}
        </p>

        <h5 className="mb-6 font-mono tracking-wider">{applicationNumber}</h5>

        {/* Copy details */}
        <div className="flex items-center justify-center gap-1.5">
          {copied ? (
            <>
              <span className="text-sm text-green-700">
                {isRTL ? "تم النسخ" : "Copied to clipboard"}
              </span>
              <Check className="h-3.5 w-3.5 text-green-700" />
            </>
          ) : (
            <>
              <span className="text-muted-foreground text-xs">
                {isRTL ? "انسخ رقم الطلب" : "Copy application number"}
              </span>
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Copy application number"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
