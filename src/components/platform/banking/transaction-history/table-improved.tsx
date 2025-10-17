'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Receipt,
  Calendar,
  ArrowUpDown,
  Eye
} from 'lucide-react'
import { formatAmount, formatDateTime } from '@/components/banking/lib/utils'
import { cn } from '@/lib/utils'
import type { Transaction, BankAccount, BankingDictionary } from '../types'

interface TransactionsTableImprovedProps {
  transactions: Transaction[]
  accounts: BankAccount[]
  currentPage?: number
  dictionary?: BankingDictionary
  isLoading?: boolean
  onPageChange?: (page: number) => void
  onExport?: (format: 'csv' | 'pdf') => void
  className?: string
}

interface FilterState {
  search: string
  category: string
  dateRange: string
  type: 'all' | 'credit' | 'debit'
  status: 'all' | 'pending' | 'completed'
  account: string
}

interface SortState {
  column: keyof Transaction | null
  direction: 'asc' | 'desc'
}

export function TransactionsTableImproved({
  transactions,
  accounts,
  currentPage = 1,
  dictionary,
  isLoading = false,
  onPageChange,
  onExport,
  className
}: TransactionsTableImprovedProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    dateRange: '',
    type: 'all',
    status: 'all',
    account: ''
  })

  const [sortState, setSortState] = useState<SortState>({
    column: 'date',
    direction: 'desc'
  })

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [detailsSheet, setDetailsSheet] = useState<Transaction | null>(null)
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    description: true,
    account: true,
    category: true,
    status: true,
    amount: true
  })

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          transaction.name.toLowerCase().includes(searchLower) ||
          transaction.category?.toLowerCase().includes(searchLower) ||
          transaction.merchantName?.toLowerCase().includes(searchLower)

        if (!matchesSearch) return false
      }

      // Type filter
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false
      }

      // Status filter
      if (filters.status === 'pending' && !transaction.pending) return false
      if (filters.status === 'completed' && transaction.pending) return false

      // Account filter
      if (filters.account && transaction.bankAccountId !== filters.account) {
        return false
      }

      // Category filter
      if (filters.category && transaction.category !== filters.category) {
        return false
      }

      return true
    })
  }, [transactions, filters])

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    if (!sortState.column) return filteredTransactions

    return [...filteredTransactions].sort((a, b) => {
      const aValue = a[sortState.column as keyof Transaction]
      const bValue = b[sortState.column as keyof Transaction]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      let comparison = 0
      if (aValue > bValue) comparison = 1
      if (aValue < bValue) comparison = -1

      return sortState.direction === 'asc' ? comparison : -comparison
    })
  }, [filteredTransactions, sortState])

  // Pagination
  const pageSize = 20
  const totalPages = Math.ceil(sortedTransactions.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + pageSize)

  // Handle sorting
  const handleSort = useCallback((column: keyof Transaction) => {
    setSortState(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  // Handle row selection
  const toggleRowSelection = useCallback((id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const toggleAllRows = useCallback(() => {
    if (selectedRows.size === paginatedTransactions.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedTransactions.map(t => t.id)))
    }
  }, [paginatedTransactions, selectedRows])

  // Get unique categories for filter
  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category).filter(Boolean)))
  }, [transactions])

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>{dictionary?.transactions || 'Transactions'}</CardTitle>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Column visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(visibleColumns).map(([key, value]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setVisibleColumns(prev => ({ ...prev, [key]: checked }))
                    }
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export menu */}
            {onExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onExport('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={dictionary?.searchTransactions || 'Search transactions...'}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as any }))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {accounts.length > 1 && (
              <Select
                value={filters.account}
                onValueChange={(value) => setFilters(prev => ({ ...prev, account: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Accounts</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedRows.size === paginatedTransactions.length && paginatedTransactions.length > 0}
                    onCheckedChange={toggleAllRows}
                    aria-label="Select all transactions"
                  />
                </TableHead>
                {visibleColumns.date && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:text-foreground"
                      onClick={() => handleSort('date')}
                    >
                      {dictionary?.date || 'Date'}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                )}
                {visibleColumns.description && (
                  <TableHead>{dictionary?.description || 'Description'}</TableHead>
                )}
                {visibleColumns.account && (
                  <TableHead>{dictionary?.account || 'Account'}</TableHead>
                )}
                {visibleColumns.category && (
                  <TableHead>{dictionary?.category || 'Category'}</TableHead>
                )}
                {visibleColumns.status && (
                  <TableHead>{dictionary?.status || 'Status'}</TableHead>
                )}
                {visibleColumns.amount && (
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:text-foreground ml-auto"
                      onClick={() => handleSort('amount')}
                    >
                      {dictionary?.amount || 'Amount'}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                )}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((transaction) => {
                const account = accounts.find(a => a.id === transaction.bankAccountId)
                const isSelected = selectedRows.has(transaction.id)
                const isExpanded = expandedRow === transaction.id

                return (
                  <TableRow
                    key={transaction.id}
                    className={cn(
                      "transition-colors",
                      isSelected && "bg-muted/50"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRowSelection(transaction.id)}
                        aria-label={`Select transaction ${transaction.name}`}
                      />
                    </TableCell>
                    {visibleColumns.date && (
                      <TableCell className="font-medium">
                        {formatDateTime(new Date(transaction.date)).dateOnly}
                      </TableCell>
                    )}
                    {visibleColumns.description && (
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.name}</p>
                          {transaction.merchantName && (
                            <p className="text-sm text-muted-foreground">
                              {transaction.merchantName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.account && (
                      <TableCell>
                        {account?.name || '-'}
                      </TableCell>
                    )}
                    {visibleColumns.category && (
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {transaction.category}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.status && (
                      <TableCell>
                        <Badge
                          variant={transaction.pending ? 'secondary' : 'default'}
                          className="capitalize"
                        >
                          {transaction.pending
                            ? (dictionary?.pending || 'Pending')
                            : (dictionary?.completed || 'Completed')}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.amount && (
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-semibold tabular-nums",
                          transaction.type === 'credit'
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {transaction.type === 'credit' ? '+' : '-'}
                          {formatAmount(Math.abs(transaction.amount))}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setDetailsSheet(transaction)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">View transaction details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedTransactions.length)} of{' '}
              {sortedTransactions.length} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {sortedTransactions.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">
              {dictionary?.noTransactionsFound || 'No transactions found'}
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search criteria
            </p>
          </div>
        )}
      </CardContent>

      {/* Transaction Details Sheet */}
      <Sheet open={!!detailsSheet} onOpenChange={(open) => !open && setDetailsSheet(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Transaction Details</SheetTitle>
            <SheetDescription>
              Complete information about this transaction
            </SheetDescription>
          </SheetHeader>
          {detailsSheet && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{detailsSheet.name}</p>
              </div>
              {detailsSheet.merchantName && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Merchant</p>
                  <p className="font-medium">{detailsSheet.merchantName}</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className={cn(
                  "text-2xl font-bold",
                  detailsSheet.type === 'credit'
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}>
                  {detailsSheet.type === 'credit' ? '+' : '-'}
                  {formatAmount(Math.abs(detailsSheet.amount))}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {formatDateTime(new Date(detailsSheet.date)).dateTime}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Category</p>
                <Badge variant="outline" className="capitalize">
                  {detailsSheet.category}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={detailsSheet.pending ? 'secondary' : 'default'}>
                  {detailsSheet.pending ? 'Pending' : 'Completed'}
                </Badge>
              </div>
              {detailsSheet.location && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {[
                      detailsSheet.location.address,
                      detailsSheet.location.city,
                      detailsSheet.location.region,
                      detailsSheet.location.postalCode,
                      detailsSheet.location.country
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  )
}