// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Main Receipts Content Component
 * Follows Hogwarts content pattern - client component that composes the feature
 */

"use client"

import * as React from "react"
import { Grid3X3, List, LoaderCircle, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useDebouncedCallback } from "@/components/table/use-debounced-callback"

import { getReceipts } from "./actions"
import { getColumns } from "./columns"
import { ReceiptCard } from "./receipt-card"
import { DataTable } from "./table"
import { ExpenseReceipt } from "./types"
import { UploadForm } from "./upload-form"

interface ReceiptsContentProps {
  initialReceipts?: ExpenseReceipt[]
  locale?: string
}

export function ReceiptsContent({
  initialReceipts = [],
  locale = "en",
}: ReceiptsContentProps) {
  const { dictionary } = useDictionary()
  const fd = (dictionary as any)?.finance
  const rp = fd?.receiptPage as Record<string, string> | undefined

  const [receipts, setReceipts] =
    React.useState<ExpenseReceipt[]>(initialReceipts)
  // True DB row count for the current search scope — `receipts.length` alone
  // is capped by getReceipts' server-side limit (default 50, max 100), so it
  // understates how many receipts actually exist once a school passes that.
  const [totalReceipts, setTotalReceipts] = React.useState(
    initialReceipts.length
  )
  const [isLoading, setIsLoading] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const columns = React.useMemo(
    () => getColumns(fd, rp, locale),
    [fd, rp, locale]
  )

  const loadReceipts = React.useCallback(async (search?: string) => {
    setIsLoading(true)
    try {
      const result = await getReceipts(search ? { search } : undefined)
      if (result.success && result.data) {
        setReceipts(result.data.receipts)
        setTotalReceipts(result.data.total)
      }
    } catch (error) {
      console.error("Failed to load receipts:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (initialReceipts.length === 0) {
      void loadReceipts()
    }
  }, [initialReceipts.length, loadReceipts])

  // Search is server-side (see actions.ts `getReceipts({ search })`) so it
  // covers the whole tenant-scoped dataset, not just the loaded page. Debounced
  // to avoid a request per keystroke.
  const debouncedSearch = useDebouncedCallback((value: string) => {
    void loadReceipts(value || undefined)
  }, 300)

  const handleSearchChange = React.useCallback(
    (value: string) => {
      setSearchTerm(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  // Auto-refresh every 10 seconds to check for processing updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      const hasProcessing = receipts.some(
        (r) => r.status === "processing" || r.status === "pending"
      )
      if (hasProcessing) {
        void loadReceipts(searchTerm || undefined)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [receipts, loadReceipts, searchTerm])

  const stats = React.useMemo(() => {
    return {
      total: totalReceipts,
      processed: receipts.filter((r) => r.status === "processed").length,
      pending: receipts.filter(
        (r) => r.status === "pending" || r.status === "processing"
      ).length,
      error: receipts.filter((r) => r.status === "error").length,
    }
  }, [receipts, totalReceipts])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{rp?.heading || "Receipts"}</h2>
          <p className="text-muted-foreground">
            {rp?.description ||
              "Manage and track your expense receipts with AI-powered extraction"}
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {rp?.uploadReceipt || "Upload Receipt"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {rp?.uploadNewReceipt || "Upload New Receipt"}
              </DialogTitle>
              <DialogDescription>
                {rp?.uploadDescription ||
                  "Upload a receipt image or PDF. AI will automatically extract the data."}
              </DialogDescription>
            </DialogHeader>
            <UploadForm locale={locale} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {rp?.totalReceipts || "Total Receipts"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {rp?.processed || "Processed"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-chart-2 text-2xl font-bold">
              {stats.processed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {rp?.processing || "Processing"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-primary text-2xl font-bold">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {rp?.errors || "Errors"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-destructive text-2xl font-bold">
              {stats.error}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "grid" | "table")}
        >
          <TabsList>
            <TabsTrigger value="grid" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              {rp?.grid || "Grid"}
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <List className="h-4 w-4" />
              {rp?.table || "Table"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {isLoading && receipts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
        </div>
      ) : receipts.length === 0 && !searchTerm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {rp?.noReceipts || "No receipts uploaded yet"}
            </p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="me-2 h-4 w-4" />
              {rp?.uploadFirstReceipt || "Upload Your First Receipt"}
            </Button>
          </CardContent>
        </Card>
      ) : receipts.length === 0 ? (
        // Search matched nothing — distinct from a truly empty tenant above,
        // otherwise a school with receipts would see the "upload your first
        // receipt" empty state while searching.
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              {rp?.noReceiptsFound || "No receipts found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {receipts.map((receipt) => (
                <ReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={receipts}
              searchValue={searchTerm}
              onSearchChange={handleSearchChange}
              total={totalReceipts}
            />
          )}
        </>
      )}
    </div>
  )
}
