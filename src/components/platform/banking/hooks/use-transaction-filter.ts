import { useMemo } from 'react'

export interface Transaction {
  id: string
  name: string
  amount: number
  category: string
  date: string
  type: 'credit' | 'debit'
  pending?: boolean
  merchantName?: string
  [key: string]: any
}

export interface FilterOptions {
  category?: string | null
  searchTerm?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  minAmount?: number | null
  maxAmount?: number | null
  status?: 'pending' | 'completed' | null
}

export interface SortOptions {
  field: 'date' | 'amount' | 'name'
  direction: 'asc' | 'desc'
}

/**
 * useTransactionFilter - Optimized hook for filtering and sorting transactions
 *
 * This hook provides a memoized way to filter and sort transactions based on
 * various criteria. All filtering and sorting logic is memoized to prevent
 * unnecessary recalculations on each render.
 *
 * @param transactions - Array of transactions to filter
 * @param options - Filter options (category, search, dates, amounts, status)
 * @param sortOptions - Sort configuration (field and direction)
 *
 * @example
 * const { filteredTransactions, categories, stats } = useTransactionFilter(
 *   transactions,
 *   { category: 'Food', searchTerm: 'starbucks' },
 *   { field: 'date', direction: 'desc' }
 * )
 */
export function useTransactionFilter(
  transactions: Transaction[],
  options: FilterOptions = {},
  sortOptions?: SortOptions
) {
  // Extract unique categories from transactions
  const categories = useMemo(() => {
    if (!transactions?.length) return []
    return [...new Set(transactions.map(t => t.category))].sort()
  }, [transactions])

  // Apply filters
  const filteredTransactions = useMemo(() => {
    if (!transactions?.length) return []

    let filtered = transactions

    // Category filter
    if (options.category) {
      filtered = filtered.filter(t => t.category === options.category)
    }

    // Search filter (searches name and merchant name)
    if (options.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        (t.merchantName && t.merchantName.toLowerCase().includes(searchLower))
      )
    }

    // Date range filter
    if (options.dateFrom) {
      const fromDate = new Date(options.dateFrom)
      filtered = filtered.filter(t => new Date(t.date) >= fromDate)
    }

    if (options.dateTo) {
      const toDate = new Date(options.dateTo)
      filtered = filtered.filter(t => new Date(t.date) <= toDate)
    }

    // Amount range filter
    if (options.minAmount !== null && options.minAmount !== undefined) {
      filtered = filtered.filter(t => Math.abs(t.amount) >= options.minAmount!)
    }

    if (options.maxAmount !== null && options.maxAmount !== undefined) {
      filtered = filtered.filter(t => Math.abs(t.amount) <= options.maxAmount!)
    }

    // Status filter
    if (options.status === 'pending') {
      filtered = filtered.filter(t => t.pending === true)
    } else if (options.status === 'completed') {
      filtered = filtered.filter(t => t.pending !== true)
    }

    return filtered
  }, [transactions, options])

  // Apply sorting
  const sortedTransactions = useMemo(() => {
    if (!sortOptions) return filteredTransactions

    const sorted = [...filteredTransactions]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortOptions.field) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount)
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
      }

      return sortOptions.direction === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [filteredTransactions, sortOptions])

  // Calculate statistics
  const stats = useMemo(() => {
    if (!sortedTransactions.length) {
      return {
        total: 0,
        totalCredit: 0,
        totalDebit: 0,
        count: 0,
        avgAmount: 0,
      }
    }

    const total = sortedTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalCredit = sortedTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalDebit = sortedTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return {
      total,
      totalCredit,
      totalDebit,
      count: sortedTransactions.length,
      avgAmount: total / sortedTransactions.length,
    }
  }, [sortedTransactions])

  // Get category distribution
  const categoryDistribution = useMemo(() => {
    if (!sortedTransactions.length) return []

    const distribution = sortedTransactions.reduce((acc, t) => {
      const existing = acc.find(item => item.category === t.category)
      if (existing) {
        existing.count++
        existing.total += Math.abs(t.amount)
      } else {
        acc.push({
          category: t.category,
          count: 1,
          total: Math.abs(t.amount),
        })
      }
      return acc
    }, [] as Array<{ category: string; count: number; total: number }>)

    return distribution.sort((a, b) => b.total - a.total)
  }, [sortedTransactions])

  return {
    filteredTransactions: sortedTransactions,
    categories,
    stats,
    categoryDistribution,
    hasFilters: Object.values(options).some(v => v !== null && v !== undefined),
  }
}

/**
 * usePaginatedTransactions - Hook for paginating transaction lists
 *
 * @param transactions - Array of transactions to paginate
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 *
 * @example
 * const { paginatedTransactions, totalPages, hasNext, hasPrev } =
 *   usePaginatedTransactions(transactions, currentPage, 20)
 */
export function usePaginatedTransactions(
  transactions: Transaction[],
  page: number = 1,
  pageSize: number = 20
) {
  const paginatedTransactions = useMemo(() => {
    if (!transactions?.length) return []

    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    return transactions.slice(startIndex, endIndex)
  }, [transactions, page, pageSize])

  const totalPages = useMemo(() => {
    return Math.ceil((transactions?.length || 0) / pageSize)
  }, [transactions, pageSize])

  return {
    paginatedTransactions,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    startIndex: (page - 1) * pageSize,
    endIndex: Math.min(page * pageSize, transactions?.length || 0),
    total: transactions?.length || 0,
  }
}
