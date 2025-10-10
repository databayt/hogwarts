"use client";

/**
 * All invoices view component
 *
 * Displays a grid or list of all invoices with filtering and sorting options.
 */

import { useState } from "react";
import { InvoiceCard, InvoiceCompactCard } from "./card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3x3, List, SlidersHorizontal, FileText } from "lucide-react";
import type { InvoiceWithSchool, InvoiceFilters, InvoiceStatus } from "./types";
import { INVOICE_STATUSES } from "./config";
import { sortInvoices } from "./util";

interface AllInvoicesProps {
  invoices: InvoiceWithSchool[];
  defaultView?: "grid" | "list";
  showFilters?: boolean;
  onInvoiceClick?: (invoiceId: string) => void;
  onMarkPaid?: (invoiceId: string) => void;
}

/**
 * All invoices view with filtering and layout options
 */
export function AllInvoices({
  invoices,
  defaultView = "grid",
  showFilters = true,
  onInvoiceClick,
  onMarkPaid,
}: AllInvoicesProps) {
  const [view, setView] = useState<"grid" | "list">(defaultView);
  const [filters, setFilters] = useState<InvoiceFilters>({
    search: "",
    number: "",
    tenantName: "",
    status: "",
  });
  const [sortField, setSortField] = useState<"number" | "tenantName" | "amount" | "createdAt">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    // Global search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        invoice.stripeInvoiceId.toLowerCase().includes(searchLower) ||
        invoice.school.name.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Number filter
    if (filters.number && !invoice.stripeInvoiceId.toLowerCase().includes(filters.number.toLowerCase())) {
      return false;
    }

    // Tenant name filter
    if (filters.tenantName && !invoice.school.name.toLowerCase().includes(filters.tenantName.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filters.status && invoice.status !== filters.status) {
      return false;
    }

    return true;
  });

  // Sort invoices
  const sortedInvoices = sortInvoices(
    filteredInvoices.map((inv) => ({
      ...inv,
      number: inv.stripeInvoiceId,
      tenantName: inv.school.name,
      amount: inv.amountDue,
    })),
    sortField,
    sortDirection
  );

  return (
    <div className="space-y-4">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3>All Invoices</h3>
          <span className="rounded-full bg-muted px-2 py-1">
            <small>{sortedInvoices.length}</small>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("grid")}
          >
            <Grid3x3 className="size-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid gap-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {INVOICE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by tenant..."
            value={filters.tenantName}
            onChange={(e) => setFilters({ ...filters, tenantName: e.target.value })}
          />

          <Select
            value={`${sortField}-${sortDirection}`}
            onValueChange={(value) => {
              const [field, direction] = value.split("-") as [
                "number" | "tenantName" | "amount" | "createdAt",
                "asc" | "desc"
              ];
              setSortField(field);
              setSortDirection(direction);
            }}
          >
            <SelectTrigger>
              <SlidersHorizontal className="mr-2 size-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="number-asc">Number (A-Z)</SelectItem>
              <SelectItem value="number-desc">Number (Z-A)</SelectItem>
              <SelectItem value="tenantName-asc">Tenant (A-Z)</SelectItem>
              <SelectItem value="tenantName-desc">Tenant (Z-A)</SelectItem>
              <SelectItem value="amount-asc">Amount (Low-High)</SelectItem>
              <SelectItem value="amount-desc">Amount (High-Low)</SelectItem>
              <SelectItem value="createdAt-asc">Oldest first</SelectItem>
              <SelectItem value="createdAt-desc">Newest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Empty state */}
      {sortedInvoices.length === 0 && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            <FileText className="size-10 text-muted-foreground" />
          </div>
          <h4 className="mt-4">No invoices found</h4>
          <p className="muted mt-2 text-center max-w-sm">
            {filters.search || filters.tenantName || filters.status
              ? "Try adjusting your filters to find what you're looking for."
              : "Invoices will appear here once they are created."}
          </p>
          {(filters.search || filters.tenantName || filters.status) && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setFilters({ search: "", number: "", tenantName: "", status: "" })}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && sortedInvoices.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              showActions
              onViewDetails={onInvoiceClick}
              onMarkPaid={onMarkPaid}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && sortedInvoices.length > 0 && (
        <div className="space-y-2">
          {sortedInvoices.map((invoice) => (
            <div key={invoice.id} onClick={() => onInvoiceClick?.(invoice.id)} className="cursor-pointer">
              <InvoiceCompactCard invoice={invoice} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
