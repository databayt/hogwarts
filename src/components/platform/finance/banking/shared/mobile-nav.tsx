"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CreditCard,
  History,
  House,
  Menu,
  SendHorizontal,
  Settings,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface BankingMobileNavProps {
  user: any
  dictionary: any
  lang: string
}

export function BankingMobileNav({
  user,
  dictionary,
  lang,
}: BankingMobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    {
      title: dictionary?.dashboard || "Dashboard",
      href: `/${lang}/banking`,
      icon: House,
    },
    {
      title: dictionary?.myBanks || "My Banks",
      href: `/${lang}/banking/my-banks`,
      icon: CreditCard,
    },
    {
      title: dictionary?.paymentTransfer || "Payment Transfer",
      href: `/${lang}/banking/payment-transfer`,
      icon: SendHorizontal,
    },
    {
      title: dictionary?.transactionHistory || "Transaction History",
      href: `/${lang}/banking/transaction-history`,
      icon: History,
    },
    {
      title: dictionary?.settings || "Settings",
      href: `/${lang}/banking/settings`,
      icon: Settings,
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-40 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-6">
          <SheetTitle>Banking</SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
              <span className="text-primary text-sm font-semibold">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-muted-foreground text-xs">{user?.email}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
