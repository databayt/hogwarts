"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CreditCard,
  History,
  House,
  LogOut,
  SendHorizontal,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BankingSidebarProps {
  user: any
  dictionary: any
  lang: string
}

export function BankingSidebar({
  user,
  dictionary,
  lang,
}: BankingSidebarProps) {
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
    <aside className="bg-card flex h-screen w-64 flex-col border-r">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Banking</h2>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
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
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href={`/${lang}/logout`}>
            <LogOut className="mr-2 h-4 w-4" />
            {dictionary?.signOut || "Sign Out"}
          </Link>
        </Button>
      </div>
    </aside>
  )
}
