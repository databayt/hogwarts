"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileNav } from "./mobile-nav"
import { MainNavItem } from "./types"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface MobileNavButtonProps {
  items: MainNavItem[]
  children?: React.ReactNode
  dictionary?: Dictionary
}

export function MobileNavButton({ items, children, dictionary }: MobileNavButtonProps) {
  const [showMobileMenu, setShowMobileMenu] = React.useState(false)

  return (
    <>
      <Button
        className="flex items-center space-x-2 md:hidden"
        variant="ghost"
        size="icon"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </Button>
      {showMobileMenu && items && (
        <MobileNav items={items} dictionary={dictionary}>{children}</MobileNav>
      )}
    </>
  )
}