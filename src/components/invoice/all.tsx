"use client";

/**
 * All invoices view component
 *
 * Displays all invoices with filtering, sorting, and bulk actions.
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Plus } from "lucide-react";
import { formatCurrency, formatDueStatus, getInvoiceStatusColor } from "./util";
import { Badge } from "@/components/ui/badge";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  status: string;
  dueDate: Date;
  createdAt: Date;
}

interface AllInvoicesProps {
  invoices: Invoice[];
  onCreateNew?: () => void;
  onViewInvoice?: (id: string) => void;
}

export function AllInvoices({ invoices, onCreateNew, onViewInvoice }: AllInvoicesProps) {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });
  const [sortBy, setSortBy] = useState<"date" | "amount" | "client">("date");

  const filteredInvoices = invoices.filter((invoice) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (
        !invoice.invoiceNumber.toLowerCase().includes(search) &&
        !invoice.clientName.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    if (filters.status && invoice.status !== filters.status) {
      return false;
    }

    return true;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    switch (sortBy) {
      case "amount":
        return b.amount - a.amount;
      case "client":
        return a.clientName.localeCompare(b.clientName);
      case "date":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3>All Invoices</h3>
          <span className="rounded-full bg-muted px-2 py-1">
            <small>{sortedInvoices.length}</small>
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 size-4" />
            Export
          </Button>
          {onCreateNew && (
            <Button size="sm" onClick={onCreateNew}>
              <Plus className="mr-2 size-4" />
              New Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice list */}
      <div className="space-y-2">
        {sortedInvoices.map((invoice) => (
          <div
            key={invoice.id}
            onClick={() => onViewInvoice?.(invoice.id)}
            className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div>
                <h6>{invoice.invoiceNumber}</h6>
                <small className="muted">{invoice.clientName}</small>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-medium tabular-nums">{formatCurrency(invoice.amount)}</div>
                <small className="muted">{formatDueStatus(invoice.dueDate, invoice.status)}</small>
              </div>
              <Badge
                variant={
                  invoice.status === "paid"
                    ? "default"
                    : invoice.status === "overdue"
                    ? "destructive"
                    : "outline"
                }
              >
                {invoice.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {sortedInvoices.length === 0 && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8">
          <h4 className="mt-4">No invoices found</h4>
          <p className="muted mt-2">
            {filters.search || filters.status ? "Try adjusting your filters" : "Create your first invoice to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
