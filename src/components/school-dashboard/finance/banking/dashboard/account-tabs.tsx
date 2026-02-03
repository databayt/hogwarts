"use client"

import { memo, useCallback, useMemo, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { LoaderCircle } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatAmount } from "@/components/school-dashboard/finance/banking/lib/utils"

interface AccountTabsProps {
  accounts: any[]
  currentAccountId: string
  dictionary: any
}

interface AccountTabTriggerProps {
  account: any
}

/**
 * AccountTabTrigger - Memoized individual tab trigger
 * Prevents re-renders when sibling tabs update
 */
const AccountTabTrigger = memo(function AccountTabTrigger({
  account,
}: AccountTabTriggerProps) {
  // Format amount once and memoize
  const formattedBalance = useMemo(
    () => formatAmount(account.currentBalance),
    [account.currentBalance]
  )

  return (
    <TabsTrigger
      key={account.id}
      value={account.id}
      className="flex flex-col items-start gap-1 text-left"
    >
      <span className="text-sm font-medium">{account.name}</span>
      <span className="text-muted-foreground text-xs">{formattedBalance}</span>
    </TabsTrigger>
  )
})

/**
 * AccountTabs - Optimized account navigation tabs
 *
 * Uses React 19 useTransition for non-blocking navigation
 * Memoized to prevent unnecessary re-renders
 */
export const AccountTabs = memo(function AccountTabs({
  accounts,
  currentAccountId,
  dictionary,
}: AccountTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Memoize grid template calculation
  const gridTemplate = useMemo(
    () => ({ gridTemplateColumns: `repeat(${accounts.length}, 1fr)` }),
    [accounts.length]
  )

  // Use useCallback to prevent function recreation on each render
  const handleAccountChange = useCallback(
    (accountId: string) => {
      // Use startTransition for non-blocking navigation
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("id", accountId)
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [pathname, searchParams, router]
  )

  // Early return if no accounts to display
  if (!accounts || accounts.length <= 1) {
    return null
  }

  return (
    <div className="relative">
      <Tabs value={currentAccountId} onValueChange={handleAccountChange}>
        <TabsList className="grid w-full" style={gridTemplate}>
          {accounts.map((account: any) => (
            <AccountTabTrigger key={account.id} account={account} />
          ))}
        </TabsList>
      </Tabs>

      {/* Loading indicator during transition */}
      {isPending && (
        <div className="bg-background/50 absolute inset-0 flex items-center justify-center">
          <LoaderCircle className="h-4 w-4 animate-spin" />
        </div>
      )}
    </div>
  )
})
