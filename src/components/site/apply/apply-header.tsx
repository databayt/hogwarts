"use client"

import React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Bookmark, Check, HelpCircle, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatRelativeTime } from "@/components/file"

interface ApplyHeaderProps {
  /** URL to return to (e.g., campaign selector) */
  backUrl?: string
  /** Callback for help button */
  onHelp?: () => void
  /** Callback for save button */
  onSave?: () => void
  /** Whether currently saving */
  isSaving?: boolean
  /** Last saved timestamp */
  lastSaved?: Date | null
  /** School logo URL */
  logoSrc?: string
  /** Show save button */
  showSave?: boolean
  /** Show help button */
  showHelp?: boolean
  /** Is RTL layout */
  isRTL?: boolean
  /** Dictionary for translations */
  dictionary?: {
    saving?: string
    lastSaved?: string
    help?: string
    save?: string
    exitApplication?: string
  }
}

export function ApplyHeader({
  backUrl,
  onHelp,
  onSave,
  isSaving = false,
  lastSaved,
  logoSrc,
  showSave = true,
  showHelp = true,
  isRTL = false,
  dictionary,
}: ApplyHeaderProps) {
  const router = useRouter()
  const dict = dictionary || {}

  const handleExit = () => {
    if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  return (
    <header className="w-full py-4">
      <div
        className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Left side - Exit button and logo */}
        <div
          className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : "flex-row"}`}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExit}
            className="rounded-full"
            aria-label={dict.exitApplication || "Exit application"}
          >
            <X className="h-4 w-4" />
          </Button>
          {logoSrc && (
            <div className="relative h-5 w-5">
              <Image
                src={logoSrc}
                alt="School logo"
                fill
                sizes="20px"
                className="object-contain"
              />
            </div>
          )}
        </div>

        {/* Right side - Save status, Help and Save buttons */}
        <div
          className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : "flex-row"}`}
        >
          {/* Save status indicator */}
          {lastSaved && !isSaving && (
            <div
              className={`text-muted-foreground hidden items-center gap-1 text-xs sm:flex ${isRTL ? "flex-row-reverse" : "flex-row"}`}
            >
              <Check className="h-3 w-3 text-green-500" />
              <span>
                {(
                  dict.lastSaved ||
                  (isRTL ? "آخر حفظ {time}" : "Last saved {time}")
                ).replace("{time}", formatRelativeTime(lastSaved))}
              </span>
            </div>
          )}
          {isSaving && (
            <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex">
              <Loader2 className="h-3 w-3 animate-spin" />
              {dict.saving || (isRTL ? "جاري الحفظ..." : "Saving...")}
            </span>
          )}

          {showHelp && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onHelp}
              className="rounded-full"
              aria-label={dict.help || "Help"}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          )}
          {showSave && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSave}
              disabled={isSaving}
              className="rounded-full"
              aria-label={dict.save || "Save"}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default ApplyHeader
