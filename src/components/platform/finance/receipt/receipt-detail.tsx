/**
 * Receipt Detail Component
 * Displays full receipt information with image/PDF preview
 * Follows Hogwarts component pattern
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ExpenseReceipt, ReceiptItem } from './types'
import { deleteReceipt, retryReceiptExtraction } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  LoaderCircle,
  CircleAlert,
  CircleCheck,
  Clock,
  Trash2,
  RefreshCw,
  Download,
} from 'lucide-react'

interface ReceiptDetailProps {
  receipt: ExpenseReceipt
  locale?: string
}

export function ReceiptDetail({ receipt, locale = 'en' }: ReceiptDetailProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isRetrying, setIsRetrying] = React.useState(false)

  const statusConfig = {
    pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
    processing: { label: 'Processing', variant: 'default' as const, icon: LoaderCircle },
    processed: { label: 'Processed', variant: 'default' as const, icon: CircleCheck },
    error: { label: 'Error', variant: 'destructive' as const, icon: CircleAlert },
  }

  const status = statusConfig[receipt.status]
  const StatusIcon = status.icon

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteReceipt(receipt.id)
      if (result.success) {
        toast.success('Receipt deleted successfully')
        router.push('..')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete receipt')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      const result = await retryReceiptExtraction(receipt.id)
      if (result.success) {
        toast.success('Extraction retry started. Please wait...')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to retry extraction')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsRetrying(false)
    }
  }

  const items: ReceiptItem[] = Array.isArray(receipt.items)
    ? receipt.items
    : receipt.items
    ? (receipt.items as any).items || []
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {receipt.fileDisplayName || receipt.fileName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Uploaded {format(new Date(receipt.uploadedAt), 'PPP')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className={`h-3 w-3 ${receipt.status === 'processing' ? 'animate-spin' : ''}`} />
            {status.label}
          </Badge>
          {receipt.status === 'error' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Receipt Image/PDF Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Receipt Image</CardTitle>
          </CardHeader>
          <CardContent>
            {receipt.mimeType.startsWith('image/') ? (
              <img
                src={receipt.fileUrl}
                alt={receipt.fileName}
                className="rounded-lg border w-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 border rounded-lg">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">PDF Document</p>
                <Button variant="outline" asChild>
                  <a href={receipt.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    View PDF
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extracted Data */}
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {receipt.status === 'processed' ? (
              <>
                {receipt.merchantName && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      Merchant
                    </div>
                    <p className="text-sm ml-6">{receipt.merchantName}</p>
                    {receipt.merchantAddress && (
                      <p className="text-xs text-muted-foreground ml-6">
                        {receipt.merchantAddress}
                      </p>
                    )}
                  </div>
                )}

                {receipt.merchantContact && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4" />
                      Contact
                    </div>
                    <p className="text-sm ml-6">{receipt.merchantContact}</p>
                  </div>
                )}

                {receipt.transactionDate && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      Date
                    </div>
                    <p className="text-sm ml-6">
                      {format(new Date(receipt.transactionDate), 'PPP')}
                    </p>
                  </div>
                )}

                {receipt.transactionAmount !== null && receipt.transactionAmount !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign className="h-4 w-4" />
                      Amount
                    </div>
                    <p className="text-lg font-semibold ml-6">
                      {receipt.currency || 'USD'} {receipt.transactionAmount.toFixed(2)}
                    </p>
                  </div>
                )}

                {receipt.receiptSummary && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Summary</p>
                    <p className="text-sm text-muted-foreground">{receipt.receiptSummary}</p>
                  </div>
                )}
              </>
            ) : receipt.status === 'processing' ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                  AI extraction in progress...
                </p>
              </div>
            ) : receipt.status === 'error' ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <CircleAlert className="h-8 w-8 text-destructive mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Extraction failed. Please retry.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Clock className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Waiting for extraction to start...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index}>
                  <div className="flex items-start justify-between py-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} × {receipt.currency || 'USD'} {item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {receipt.currency || 'USD'} {item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                  {index < items.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.push('..')}
        >
          Back to List
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
