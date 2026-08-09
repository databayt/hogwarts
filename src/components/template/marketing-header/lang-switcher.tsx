"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { usePathname, useRouter } from "next/navigation"
import { Languages } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  localeConfig,
  type Locale,
} from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface LangSwitcherProps {
  className?: string
}

export function LangSwitcher({ className }: LangSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { dictionary } = useDictionary()

  const currentLang = pathname.split("/")[1] || "en"
  const nextLang = currentLang === "ar" ? "en" : "ar"

  // This is the control's ONLY accessible name — the icon carries no text — so
  // it was the one label on an Arabic page still read out in English ("Switch
  // to English", beside "بحث" / "تبديل المظهر" / "تسجيل الدخول").
  //
  // The target language is named in its OWN script rather than translated:
  // someone hunting for Arabic recognises "العربية" whichever page they landed
  // on, which is the whole reason a switcher exists. The verb comes from the
  // dictionary, so the sentence around it follows the current locale.
  const switchLabel = dictionary?.common?.switchLanguage ?? "Switch language"
  const targetName = localeConfig[nextLang as Locale]?.nativeName ?? nextLang

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
        {switchLabel} — {targetName}
      </span>
    </Button>
  )
}
