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
import { useSession } from "next-auth/react"

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
  dictionary?: any
  lang?: string
}

export default function SuccessCompletionModal({
  schoolData,
  showModal,
  setShowModal,
  onGoToDashboard,
  dictionary,
  lang,
}: SuccessCompletionModalProps) {
  const dict = dictionary?.school?.onboarding || {}
  const { data: session } = useSession()
  const [copied, setCopied] = useState(false)
  const [animationData, setAnimationData] = useState<object | null>(null)
  const [password, setPassword] = useState<string | null>(null)

  useEffect(() => {
    const pw = sessionStorage.getItem("_onboard_pw")
    if (pw) setPassword(pw)
  }, [])

  useEffect(() => {
    fetch("/animations/confetti.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(console.error)
  }, [])

  // Strip common prefixes (ed., www.) so school URL is school.databayt.org
  const rawRoot = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "databayt.org"
  const rootDomain = rawRoot.replace(/^(ed\.|www\.)/, "") || rawRoot
  const fullDomain = `${schoolData.domain}.${rootDomain}`

  const handleCopy = useCallback(() => {
    const info = [
      `School: ${schoolData.name}`,
      `URL: ${fullDomain}`,
      `Admin: ${session?.user?.email || "Your login email"}`,
      `Password: ${password || "\u2022\u2022\u2022\u2022"}`,
      `Docs: ed.databayt.org/docs`,
    ].join("\n")

    navigator.clipboard.writeText(info).then(() => {
      setCopied(true)
      sessionStorage.removeItem("_onboard_pw")
      setTimeout(() => setCopied(false), 2000)
    })
  }, [schoolData.name, fullDomain, session?.user?.email, password])

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="md:max-w-sm"
      preventDefaultClose={false}
    >
      <div className="px-8 py-12 text-center">
        {/* Celebration Animation - always reserve space to prevent layout shift */}
        <div className="mx-auto mb-4 h-32 w-32">
          {animationData && (
            <Lottie animationData={animationData} loop autoplay />
          )}
        </div>

        {/* Success Message */}
        <p className="text-muted-foreground mb-2">
          {dict.yourSchoolLivesAt || "Your school lives at"}
        </p>

        <h5 className="mb-6">
          <a
            href={`http://${fullDomain}${lang ? `/${lang}` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline transition-colors hover:opacity-80"
          >
            {fullDomain}
          </a>
        </h5>

        {/* Copy school details - only icon is clickable */}
        <div className="flex items-center justify-center gap-1.5">
          {copied ? (
            <>
              <span className="text-xs text-green-700">
                {dict.copiedToClipboard || "Copied to clipboard"}
              </span>
              <Check className="h-3 w-3 text-green-700" />
            </>
          ) : (
            <>
              <span className="text-muted-foreground text-xs">
                {dict.copyDetailsToClipboard || "Copy details to clipboard"}
              </span>
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Copy school details"
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
