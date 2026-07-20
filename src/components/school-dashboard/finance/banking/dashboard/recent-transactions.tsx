"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useCallback, useMemo, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import {
  formatAmount,
  formatDateTime,
} from "@/components/school-dashboard/finance/banking/lib/utils"

interface RecentTransactionsListProps {
  transactions: any[]
  currentPage: number
  dictionary: any
  currency: string
}

interface TransactionRowProps {
  transaction: any
  dictionary: any
  /** Raw category slug -> translated label. Falls back to the slug when a new
   *  category appears in the data before it is added to the dictionary. */
  categoryLabels: Record<string, string>
}

/**
 * Borderless filter pill. Selection reads from fill weight rather than an
 * outline, so a long category row stays quiet instead of rendering as a
 * wall of boxes.
 */
function CategoryChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
        active
          ? "bg-foreground text-background"
          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

/**
 * TransactionRow - Memoized individual transaction row
 * Only re-renders when transaction data changes
 */
const TransactionRow = memo(function TransactionRow({
  transaction,
  dictionary,
  categoryLabels,
  locale,
  currency,
}: TransactionRowProps & { locale: string; currency: string }) {
  const formattedAmount = useMemo(
    () => formatAmount(Math.abs(transaction.amount), locale, currency),
    [transaction.amount, locale, currency]
  )

  const formattedDate = useMemo(
    () => formatDateTime(new Date(transaction.date), locale).dateOnly,
    [transaction.date, locale]
  )

  const amountColorClass =
    transaction.type === "credit"
      ? "text-emerald-600 dark:text-emerald-500"
      : "text-muted-foreground"
  const statusText = transaction.pending
    ? dictionary?.pending || "Pending"
    : dictionary?.completed || "Completed"

  return (
    <TableRow className="border-0">
      <TableCell className="font-medium">
        <div>
          <p className="font-medium">{transaction.name}</p>
          {transaction.merchantName && (
            <p className="text-muted-foreground text-sm">
              {transaction.merchantName}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className={`font-medium tabular-nums ${amountColorClass}`}>
          {formattedAmount}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={
            transaction.pending
              ? "text-muted-foreground text-sm"
              : "text-foreground text-sm"
          }
        >
          {statusText}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {formattedDate}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {categoryLabels[transaction.category] || transaction.category}
      </TableCell>
    </TableRow>
  )
})

/**
 * RecentTransactionsList - Optimized transaction list with URL-based filtering
 *
 * Uses URL search params for filtering instead of local state
 * This allows for shareable URLs and better back/forward navigation
 */
export const RecentTransactionsList = memo(function RecentTransactionsList({
  transactions = [],
  currentPage,
  dictionary,
  currency,
}: RecentTransactionsListProps) {
  const { dictionary: globalDict } = useDictionary()
  const { locale } = useLocale()
  const fd = (globalDict as any)?.finance
  const bt = fd?.bankingTransactions as Record<string, any> | undefined
  const categoryLabels = (bt?.categories ?? {}) as Record<string, string>

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Get category from URL
  const selectedCategory = searchParams.get("category")

  // Memoize filtered transactions to prevent recalculation on each render
  const filteredTransactions = useMemo(() => {
    if (!selectedCategory) return transactions
    return transactions.filter((t) => t.category === selectedCategory)
  }, [transactions, selectedCategory])

  // Memoize categories array to prevent recalculation
  const categories = useMemo(
    () => [...new Set(transactions?.map((t) => t.category) || [])],
    [transactions]
  )

  // Memoize displayed transactions (first 10)
  const displayedTransactions = useMemo(
    () => filteredTransactions.slice(0, 10),
    [filteredTransactions]
  )

  // Use useCallback for filter handler
  const handleCategoryChange = useCallback(
    (category: string | null) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (category) {
          params.set("category", category)
        } else {
          params.delete("category")
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [pathname, searchParams, router]
  )

  if (!transactions || transactions.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-4">
          {bt?.noTransactions ||
            dictionary?.noTransactions ||
            "No transactions found"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip
            active={selectedCategory === null}
            disabled={isPending}
            onClick={() => handleCategoryChange(null)}
          >
            {bt?.all || dictionary?.all || "All"}
          </CategoryChip>
          {categories.map((category: string) => (
            <CategoryChip
              key={category}
              active={selectedCategory === category}
              disabled={isPending}
              onClick={() => handleCategoryChange(category)}
            >
              {categoryLabels[category] || category}
            </CategoryChip>
          ))}
          {isPending && (
            <LoaderCircle className="text-muted-foreground h-4 w-4 animate-spin" />
          )}
        </div>
      )}

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                {bt?.transaction || dictionary?.transaction || "Transaction"}
              </TableHead>
              <TableHead>
                {bt?.amount || dictionary?.amount || "Amount"}
              </TableHead>
              <TableHead>
                {bt?.status || dictionary?.status || "Status"}
              </TableHead>
              <TableHead>{bt?.date || dictionary?.date || "Date"}</TableHead>
              <TableHead>
                {bt?.category || dictionary?.category || "Category"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTransactions.map((transaction: any) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                dictionary={bt || dictionary}
                categoryLabels={categoryLabels}
                locale={locale}
                currency={currency}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          {bt?.noMatchingTransactions ||
            dictionary?.noMatchingTransactions ||
            "No matching transactions found"}
        </div>
      )}
    </div>
  )
})
