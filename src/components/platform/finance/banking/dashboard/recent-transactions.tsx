"use client"

import { memo, useCallback, useMemo, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { LoaderCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatAmount,
  formatDateTime,
} from "@/components/platform/finance/banking/lib/utils"

interface RecentTransactionsListProps {
  transactions: any[]
  currentPage: number
  dictionary: any
}

interface TransactionRowProps {
  transaction: any
  dictionary: any
}

/**
 * TransactionRow - Memoized individual transaction row
 * Only re-renders when transaction data changes
 */
const TransactionRow = memo(function TransactionRow({
  transaction,
  dictionary,
}: TransactionRowProps) {
  const formattedAmount = useMemo(
    () => formatAmount(Math.abs(transaction.amount)),
    [transaction.amount]
  )

  const formattedDate = useMemo(
    () => formatDateTime(new Date(transaction.date)).dateOnly,
    [transaction.date]
  )

  const amountColorClass =
    transaction.type === "credit" ? "text-green-600" : "text-red-600"
  const statusVariant = transaction.pending ? "secondary" : "default"
  const statusText = transaction.pending
    ? dictionary?.pending || "Pending"
    : dictionary?.completed || "Completed"

  return (
    <TableRow>
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
        <span className={`font-medium ${amountColorClass}`}>
          {formattedAmount}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant}>{statusText}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{formattedDate}</TableCell>
      <TableCell>
        <Badge variant="outline">{transaction.category}</Badge>
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
}: RecentTransactionsListProps) {
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
          {dictionary?.noTransactions || "No transactions found"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(null)}
            disabled={isPending}
          >
            {dictionary?.all || "All"}
          </Button>
          {categories.map((category: string) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(category)}
              disabled={isPending}
            >
              {category}
            </Button>
          ))}
          {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
        </div>
      )}

      {/* Transactions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dictionary?.transaction || "Transaction"}</TableHead>
              <TableHead>{dictionary?.amount || "Amount"}</TableHead>
              <TableHead>{dictionary?.status || "Status"}</TableHead>
              <TableHead>{dictionary?.date || "Date"}</TableHead>
              <TableHead>{dictionary?.category || "Category"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTransactions.map((transaction: any) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                dictionary={dictionary}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          {dictionary?.noMatchingTransactions ||
            "No matching transactions found"}
        </div>
      )}
    </div>
  )
})
