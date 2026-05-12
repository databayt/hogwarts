"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import Image from "next/image"

import { asset } from "@/lib/asset-url"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { CHATBOT_POSITIONS } from "./constant"
import type { ChatButtonProps } from "./type"

const DEFAULT_AVATAR = asset("/illustrations/robot.png")

export function ChatButton({
  onClick,
  isOpen,
  position = "bottom-right",
  dictionary,
  schoolLogoUrl,
  schoolName,
}: ChatButtonProps) {
  const [shouldInvert, setShouldInvert] = useState(false)
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const rafRef = useRef<number | null>(null)

  // School-branded FAB when a logo is provided; otherwise fall back to the
  // generic robot illustration. The dark-section invert hack is skipped for
  // school logos because tenant logos are arbitrary and inverting a brand
  // mark looks broken.
  const usingSchoolLogo = Boolean(schoolLogoUrl)
  const avatarSrc = schoolLogoUrl ?? DEFAULT_AVATAR
  const avatarAlt = usingSchoolLogo
    ? (schoolName ?? dictionary.openChat)
    : "Chatbot"

  useEffect(() => {
    if (usingSchoolLogo) return

    const checkSections = () => {
      const button = document.querySelector("[data-chat-button]")
      if (!button) return

      const buttonRect = button.getBoundingClientRect()
      const buttonCenterY = buttonRect.top + buttonRect.height / 2

      // Check if button overlaps with dark sections (footer and blue sections)
      const darkSections = document.querySelectorAll(
        '[data-slot="school-marketing-footer"], [data-section="sales"], [data-section="ready"], [data-section="ready-to-build"], [data-section="enterprise"]'
      )

      let isOverDarkSection = false
      darkSections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        if (buttonCenterY >= rect.top && buttonCenterY <= rect.bottom) {
          isOverDarkSection = true
        }
      })

      setShouldInvert(isOverDarkSection)
    }

    const debouncedCheck = () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      checkTimeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(checkSections)
      }, 100)
    }

    checkSections()

    window.addEventListener("scroll", debouncedCheck, { passive: true })
    window.addEventListener("resize", debouncedCheck)

    return () => {
      window.removeEventListener("scroll", debouncedCheck)
      window.removeEventListener("resize", debouncedCheck)
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [usingSchoolLogo])

  return (
    <>
      {!isOpen && (
        <Button
          onClick={onClick}
          data-chat-button
          className={cn(
            CHATBOT_POSITIONS[position],
            "z-[9999] hidden transition-all duration-700 ease-in-out md:block",
            "h-12 w-12 rounded-full p-2 md:h-14 md:w-14",
            "border-none bg-transparent shadow-none hover:bg-transparent",
            "hover:scale-105",
            // School logos render full-bleed inside a circle; robot stays as-is
            usingSchoolLogo && "overflow-hidden"
          )}
          aria-label={dictionary.openChat}
          size="icon"
          variant="ghost"
        >
          <Image
            src={avatarSrc}
            alt={avatarAlt}
            width={56}
            height={56}
            className={cn(
              "h-full w-full transition-all duration-500",
              usingSchoolLogo ? "rounded-full object-cover" : "object-contain",
              !usingSchoolLogo && shouldInvert && "invert"
            )}
            unoptimized={
              // School logos may be external URLs that aren't in next.config
              // image domains; skip optimization to avoid runtime 502s.
              usingSchoolLogo
            }
          />
        </Button>
      )}
    </>
  )
}
