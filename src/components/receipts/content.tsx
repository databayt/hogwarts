/**
 * Main Receipts Content Component
 * Follows Hogwarts content pattern - client component that composes the feature
 */

'use client'

import * as React from 'react'
import { ExpenseReceipt } from './types'
import { getReceipts } from './actions'
import { UploadForm } from './upload-form'
import { ReceiptCard } from './receipt-card'
import { DataTable } from './table'
import { getColumns } from './columns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Grid3x3, List, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ReceiptsContentProps {
  initialReceipts?: ExpenseReceipt[]
  locale?: string
}

export function ReceiptsContent({ initialReceipts = [], locale = 'en' }: ReceiptsContentProps) {
  const [receipts, setReceipts] = React.useState<ExpenseReceipt[]>(initialReceipts)
  const [isLoading, setIsLoading] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false)

  const columns = React.useMemo(() => getColumns(), [])

  const loadReceipts = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getReceipts()
      if (result.success && result.data) {
        setReceipts(result.data.receipts)
      }
    } catch (error) {
      console.error('Failed to load receipts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (initialReceipts.length === 0) {
      void loadReceipts()
    }
  }, [initialReceipts.length, loadReceipts])

  // Auto-refresh every 10 seconds to check for processing updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      const hasProcessing = receipts.some(r => r.status === 'processing' || r.status === 'pending')
      if (hasProcessing) {
        void loadReceipts()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [receipts, loadReceipts])

  const stats = React.useMemo(() => {
    return {
      total: receipts.length,
      processed: receipts.filter(r => r.status === 'processed').length,
      pending: receipts.filter(r => r.status === 'pending' || r.status === 'processing').length,
      error: receipts.filter(r => r.status === 'error').length,
    }
  }, [receipts])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Receipts</h2>
          <p className="text-muted-foreground">
            Manage and track your expense receipts with AI-powered extraction
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Receipt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload New Receipt</DialogTitle>
              <DialogDescription>
                Upload a receipt image or PDF. AI will automatically extract the data.
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
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'table')}>
          <TabsList>
            <TabsTrigger value="grid" className="gap-2">
              <Grid3x3 className="h-4 w-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <List className="h-4 w-4" />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {isLoading && receipts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : receipts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No receipts uploaded yet</p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Your First Receipt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {receipts.map((receipt) => (
                <ReceiptCard key={receipt.id} receipt={receipt} locale={locale} />
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={receipts} />
          )}
        </>
      )}
    </div>
  )
}
