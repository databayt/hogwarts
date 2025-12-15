"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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

interface TransactionsTableProps {
  transactions: any[]
  accounts: any[]
  currentPage: number
  dictionary: any
}

export function TransactionsTable({
  transactions,
  accounts,
  currentPage,
  dictionary,
}: TransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTransactions = searchTerm
    ? transactions.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.merchantName &&
            t.merchantName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : transactions

  const pageSize = 20
  const startIndex = (currentPage - 1) * pageSize
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + pageSize
  )

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder={dictionary?.searchTransactions || "Search transactions..."}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dictionary?.date || "Date"}</TableHead>
              <TableHead>{dictionary?.description || "Description"}</TableHead>
              <TableHead>{dictionary?.account || "Account"}</TableHead>
              <TableHead>{dictionary?.category || "Category"}</TableHead>
              <TableHead>{dictionary?.status || "Status"}</TableHead>
              <TableHead className="text-right">
                {dictionary?.amount || "Amount"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction: any) => {
              const account = accounts.find(
                (a) => a.id === transaction.bankAccountId
              )

              return (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {formatDateTime(new Date(transaction.date)).dateOnly}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{transaction.name}</p>
                      {transaction.merchantName && (
                        <p className="text-muted-foreground text-sm">
                          {transaction.merchantName}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{account?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={transaction.pending ? "secondary" : "default"}
                    >
                      {transaction.pending
                        ? dictionary?.pending || "Pending"
                        : dictionary?.completed || "Completed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-medium ${
                        transaction.type === "credit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "credit" ? "+" : "-"}
                      {formatAmount(Math.abs(Number(transaction.amount)))}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          {dictionary?.noTransactionsFound || "No transactions found"}
        </div>
      )}
    </div>
  )
}
