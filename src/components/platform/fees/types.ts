import { z } from "zod";
import {
  feeStructureSchema,
  paymentSchema,
  scholarshipSchema,
  refundSchema,
  feeAssignmentSchema,
} from "./validation";

// Infer types from Zod schemas
export type FeeStructure = z.infer<typeof feeStructureSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type Scholarship = z.infer<typeof scholarshipSchema>;
export type Refund = z.infer<typeof refundSchema>;
export type FeeAssignment = z.infer<typeof feeAssignmentSchema>;

// Enums
export const FeeStatus = {
  PENDING: "PENDING",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;

export const PaymentMethod = {
  CASH: "CASH",
  CHEQUE: "CHEQUE",
  BANK_TRANSFER: "BANK_TRANSFER",
  CREDIT_CARD: "CREDIT_CARD",
  DEBIT_CARD: "DEBIT_CARD",
  UPI: "UPI",
  NET_BANKING: "NET_BANKING",
  WALLET: "WALLET",
  OTHER: "OTHER",
} as const;

export const PaymentStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export const RefundStatus = {
  REQUESTED: "REQUESTED",
  APPROVED: "APPROVED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export const LateFeeType = {
  FIXED: "FIXED",
  PERCENTAGE: "PERCENTAGE",
  DAILY: "DAILY",
  MONTHLY: "MONTHLY",
} as const;

export const CoverageType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
  FULL: "FULL",
} as const;

export const FineType = {
  LATE_FEE: "LATE_FEE",
  LIBRARY_FINE: "LIBRARY_FINE",
  DISCIPLINE_FINE: "DISCIPLINE_FINE",
  DAMAGE_FINE: "DAMAGE_FINE",
  OTHER: "OTHER",
} as const;

// Type exports
export type FeeStatus = keyof typeof FeeStatus;
export type PaymentMethod = keyof typeof PaymentMethod;
export type PaymentStatus = keyof typeof PaymentStatus;
export type RefundStatus = keyof typeof RefundStatus;
export type LateFeeType = keyof typeof LateFeeType;
export type CoverageType = keyof typeof CoverageType;
export type FineType = keyof typeof FineType;

// Fee component interface
export interface FeeComponent {
  name: string;
  amount: number;
  mandatory: boolean;
}

// Payment schedule interface
export interface PaymentSchedule {
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  description?: string;
}

// Discount interface
export interface Discount {
  type: string;
  amount: number;
  reason: string;
}

// Dashboard stats
export interface FeeStats {
  totalDue: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  collectionRate: number;
  studentsWithDues: number;
  studentsFullyPaid: number;
  currentMonthCollection: number;
  scholarshipsAwarded: number;
  refundsProcessed: number;
}

// Student fee summary
export interface StudentFeeSummary {
  studentId: string;
  studentName: string;
  class: string;
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  lastPaymentDate?: Date;
  status: FeeStatus;
}