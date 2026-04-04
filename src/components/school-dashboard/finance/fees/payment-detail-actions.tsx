// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { DownloadReceipt } from "./receipt-pdf"

interface PaymentDetailActionsProps {
  receiptData: {
    paymentNumber: string
    receiptNumber: string
    amount: string
    paymentDate: string
    paymentMethod: string
    status: string
    transactionId?: string
    studentName: string
    feeStructureName: string
    academicYear: string
    schoolName?: string
  }
}

export function PaymentDetailActions({
  receiptData,
}: PaymentDetailActionsProps) {
  return <DownloadReceipt data={receiptData} />
}
