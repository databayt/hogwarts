// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Receipt Card Component
 * Displays receipt information in a card format
 * Follows Hogwarts component pattern
 */

"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import {
  Calendar,
  CircleAlert,
  CircleCheck,
  Clock,
  DollarSign,
  FileText,
  LoaderCircle,
  MapPin,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { ExpenseReceipt } from "./types"

interface ReceiptCardProps {
  receipt: ExpenseReceipt
  locale?: string
}

export function ReceiptCard({ receipt, locale = "en" }: ReceiptCardProps) {
  const { dictionary } = useDictionary()
  const fd = (dictionary as any)?.finance
  const rp = fd?.receiptPage as Record<string, string> | undefined
  const dateFnsLocale = locale === "ar" ? ar : enUS

  const statusConfig = {
    pending: {
      label: fd?.pending || "Pending",
      variant: "secondary" as const,
      icon: Clock,
    },
    processing: {
      label: rp?.processing || "Processing",
      variant: "default" as const,
      icon: LoaderCircle,
    },
    processed: {
      label: rp?.processed || "Processed",
      variant: "default" as const,
      icon: CircleCheck,
    },
    error: {
      label: fd?.error || "Error",
      variant: "destructive" as const,
      icon: CircleAlert,
    },
  }

  const status = statusConfig[receipt.status]
  const StatusIcon = status.icon

  return (
    // Phone: the grey card, tighter padding; the status chip keeps its own
    // width beside a long merchant title.
    <Card className="max-md:bg-muted transition-shadow hover:shadow-md max-md:border-0 max-md:shadow-none max-md:hover:shadow-none">
      <CardHeader className="max-md:p-4 max-md:pb-2">
        <div className="flex items-start justify-between max-md:gap-2">
          <div className="flex items-center gap-2 max-md:min-w-0">
            <FileText className="text-muted-foreground h-5 w-5 max-md:shrink-0" />
            <CardTitle className="text-lg max-md:text-base max-md:leading-6">
              {receipt.fileDisplayName || receipt.fileName}
            </CardTitle>
          </div>
          <Badge variant={status.variant} className="gap-1 max-md:shrink-0">
            <StatusIcon
              className={`h-3 w-3 ${receipt.status === "processing" ? "animate-spin" : ""}`}
            />
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-md:space-y-2 max-md:px-4 max-md:pb-2">
        {receipt.merchantName && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
            <div>
              <p className="font-medium">{receipt.merchantName}</p>
              {receipt.merchantAddress && (
                <p className="text-muted-foreground text-xs">
                  {receipt.merchantAddress}
                </p>
              )}
            </div>
          </div>
        )}

        {receipt.transactionDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <span>
              {format(new Date(receipt.transactionDate), "PPP", {
                locale: dateFnsLocale,
              })}
            </span>
          </div>
        )}

        {receipt.transactionAmount !== null &&
          receipt.transactionAmount !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="text-muted-foreground h-4 w-4" />
              <span className="font-semibold">
                {receipt.currency || "USD"}{" "}
                {receipt.transactionAmount.toFixed(2)}
              </span>
            </div>
          )}

        {receipt.receiptSummary && receipt.status === "processed" && (
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {receipt.receiptSummary}
          </p>
        )}

        {receipt.status === "pending" && (
          <p className="text-muted-foreground text-xs">
            {rp?.aiExtractionPending || "AI extraction pending..."}
          </p>
        )}

        {receipt.status === "error" && (
          <p className="text-destructive text-xs">
            {rp?.extractionFailed || "Extraction failed. Click to retry."}
          </p>
        )}
      </CardContent>

      <CardFooter className="text-muted-foreground flex items-center justify-between text-xs max-md:px-4 max-md:pb-3">
        <span>
          {rp?.uploaded || "Uploaded"}{" "}
          {format(new Date(receipt.uploadedAt), "PP", {
            locale: dateFnsLocale,
          })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            window.location.href = `${receipt.id}`
          }}
        >
          {rp?.viewDetails || "View Details"}
        </Button>
      </CardFooter>
    </Card>
  )
}
