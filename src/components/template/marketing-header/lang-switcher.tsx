"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { Languages } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LangSwitcher() {
  const router = useRouter()
  const pathname = usePathname()

  const switchLanguage = (lang: string) => {
    const segments = pathname.split('/')
    segments[1] = lang
    router.push(segments.join('/'))
  }

  const currentLang = pathname.split('/')[1] || 'en'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded hover:bg-[#3c4b5e] transition-colors text-white">
          <Languages className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Change language</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchLanguage('en')}
          className={currentLang === 'en' ? 'font-semibold' : ''}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLanguage('ar')}
          className={currentLang === 'ar' ? 'font-semibold' : ''}
        >
          العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}