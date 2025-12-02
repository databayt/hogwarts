/**
 * Receipt Card Component
 * Displays receipt information in a card format
 * Follows Hogwarts component pattern
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ExpenseReceipt } from './types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  LoaderCircle,
  CircleAlert,
  CircleCheck
} from 'lucide-react'

interface ReceiptCardProps {
  receipt: ExpenseReceipt
  locale?: string
}

export function ReceiptCard({ receipt, locale = 'en' }: ReceiptCardProps) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      variant: 'secondary' as const,
      icon: Clock,
    },
    processing: {
      label: 'Processing',
      variant: 'default' as const,
      icon: LoaderCircle,
    },
    processed: {
      label: 'Processed',
      variant: 'default' as const,
      icon: CircleCheck,
    },
    error: {
      label: 'Error',
      variant: 'destructive' as const,
      icon: CircleAlert,
    },
  }

  const status = statusConfig[receipt.status]
  const StatusIcon = status.icon

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">
              {receipt.fileDisplayName || receipt.fileName}
            </CardTitle>
          </div>
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className={`h-3 w-3 ${receipt.status === 'processing' ? 'animate-spin' : ''}`} />
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {receipt.merchantName && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{receipt.merchantName}</p>
              {receipt.merchantAddress && (
                <p className="text-xs text-muted-foreground">{receipt.merchantAddress}</p>
              )}
            </div>
          </div>
        )}

        {receipt.transactionDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(receipt.transactionDate), 'PPP')}</span>
          </div>
        )}

        {receipt.transactionAmount !== null && receipt.transactionAmount !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              {receipt.currency || 'USD'} {receipt.transactionAmount.toFixed(2)}
            </span>
          </div>
        )}

        {receipt.receiptSummary && receipt.status === 'processed' && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {receipt.receiptSummary}
          </p>
        )}

        {receipt.status === 'pending' && (
          <p className="text-xs text-muted-foreground">
            AI extraction pending...
          </p>
        )}

        {receipt.status === 'error' && (
          <p className="text-xs text-destructive">
            Extraction failed. Click to retry.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Uploaded {format(new Date(receipt.uploadedAt), 'PP')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            window.location.href = `${receipt.id}`
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
