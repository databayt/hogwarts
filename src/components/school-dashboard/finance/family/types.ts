// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { PaymentGateway } from "@/lib/payment/types"
import type { Locale } from "@/components/internationalization/config"

export type InstallmentStatus =
  | "PAID"
  | "PARTIAL"
  | "PENDING"
  | "OVERDUE"
  | "CANCELLED"

/** One scheduled payment — an invoice row where the school issued one. */
export interface FamilyInstallment {
  id: string
  /** 1-based position within its own fee, and how many there are in total. */
  number: number
  count: number
  invoiceNo?: string
  /** Set only when the school published the invoice as a hosted page. */
  shareToken?: string | null
  /** ISO string, or null for a fee billed as a lump with no invoice. */
  dueDate: string | null
  amount: number
  paidAmount: number
  status: InstallmentStatus
  feeAssignmentId: string
  feeName: string
  studentName: string
  academicYear: string
}

export interface FamilyPayment {
  id: string
  feeAssignmentId: string
  paymentNumber: string
  receiptNumber: string
  amount: number
  paymentDate: string
  paymentMethod: string
  status: string
  feeName: string
  academicYear: string
  studentName: string
}

export interface FamilyFee {
  id: string
  feeName: string
  studentId: string
  studentName: string
  academicYear: string
  total: number
  discount: number
  paid: number
  /** Proofs the family submitted that the bursar has not cleared yet. */
  pendingVerification: number
  remaining: number
  status: string
  installments: FamilyInstallment[]
}

export interface FamilyMoney {
  role: "STUDENT" | "GUARDIAN"
  studentNames: string[]
  /** Those names as one line, joined the way the reader's language joins a list. */
  studentLabel: string
  currency: string
  schoolName?: string
  /** Rails the school actually offers, already filtered to the configured ones. */
  methods: PaymentGateway[]
  fees: FamilyFee[]
  /** Every instalment across every fee, ordered by when it is owed. */
  installments: FamilyInstallment[]
  /** The unpaid part of that list — what this family still has to pay. */
  due: FamilyInstallment[]
  payments: FamilyPayment[]
  totals: {
    billed: number
    paid: number
    pendingVerification: number
    remaining: number
    overdue: number
  }
  nextDue: FamilyInstallment | null
}

/** Copy for the family surface, read from `finance.family` in the dictionary. */
export interface FamilyDictionary {
  title?: string
  allSettled?: string
  nothingBilled?: string
  nothingBilledBody?: string
  outstanding?: string
  dueNow?: string
  dueOn?: string
  overdueSince?: string
  noDueDate?: string
  payNow?: string
  paid?: string
  billed?: string
  remaining?: string
  overdue?: string
  awaitingVerification?: string
  installmentOf?: string
  payWith?: string
  fees?: string
  receipts?: string
  viewReceipt?: string
  fullBalanceNote?: string
  statusLabels?: Partial<Record<InstallmentStatus, string>>
  paymentStatusLabels?: Record<string, string>
}

export interface FamilySectionProps {
  money: FamilyMoney
  lang: Locale
  d?: FamilyDictionary
}
