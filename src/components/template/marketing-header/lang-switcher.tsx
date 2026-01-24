"use client"

import { usePathname, useRouter } from "next/navigation"
import { Languages } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface LangSwitcherProps {
  className?: string
}

export function LangSwitcher({ className }: LangSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()

  const currentLang = pathname.split("/")[1] || "en"
  const nextLang = currentLang === "ar" ? "en" : "ar"

  const switchLanguage = () => {
    const segments = pathname.split("/")
    segments[1] = nextLang
    // Set cookie to persist locale preference
    document.cookie = `NEXT_LOCALE=${nextLang}; path=/; max-age=31536000; samesite=lax`
    router.push(segments.join("/"))
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "size-8 cursor-pointer transition-opacity hover:opacity-70",
        className
      )}
      onClick={switchLanguage}
    >
      <Languages className="size-4" />
      <span className="sr-only">
        Switch to {nextLang === "ar" ? "Arabic" : "English"}
      </span>
    </Button>
  )
}
