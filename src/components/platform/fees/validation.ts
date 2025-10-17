import { z } from "zod";

// Fee Structure validation
export const feeStructureSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Fee structure name is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  classId: z.string().optional(),
  stream: z.string().optional(),
  description: z.string().optional(),

  // Fee Components
  tuitionFee: z.number().min(0, "Tuition fee must be positive"),
  admissionFee: z.number().min(0).optional(),
  registrationFee: z.number().min(0).optional(),
  examFee: z.number().min(0).optional(),
  libraryFee: z.number().min(0).optional(),
  laboratoryFee: z.number().min(0).optional(),
  sportsFee: z.number().min(0).optional(),
  transportFee: z.number().min(0).optional(),
  hostelFee: z.number().min(0).optional(),
  otherFees: z.array(z.object({
    name: z.string(),
    amount: z.number().min(0),
  })).optional(),

  // Schedule
  totalAmount: z.number().min(0),
  installments: z.number().min(1).max(12).default(1),
  paymentSchedule: z.array(z.object({
    installmentNumber: z.number(),
    dueDate: z.date(),
    amount: z.number().min(0),
    description: z.string().optional(),
  })).optional(),

  // Late Fee
  lateFeeAmount: z.number().min(0).optional(),
  lateFeeType: z.enum(["FIXED", "PERCENTAGE", "DAILY", "MONTHLY"]).optional(),

  isActive: z.boolean().default(true),
});

// Fee Assignment validation
export const feeAssignmentSchema = z.object({
  id: z.string().optional(),
  studentId: z.string().min(1, "Student is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  customAmount: z.number().min(0).optional(),
  finalAmount: z.number().min(0),
  discounts: z.array(z.object({
    type: z.string(),
    amount: z.number().min(0),
    reason: z.string(),
  })).optional(),
  scholarshipId: z.string().optional(),
  totalDiscount: z.number().min(0).default(0),
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).default("PENDING"),
});

// Payment validation
export const paymentSchema = z.object({
  id: z.string().optional(),
  feeAssignmentId: z.string().min(1, "Fee assignment is required"),
  studentId: z.string().min(1, "Student is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentDate: z.date().default(() => new Date()),
  paymentMethod: z.enum([
    "CASH",
    "CHEQUE",
    "BANK_TRANSFER",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "UPI",
    "NET_BANKING",
    "WALLET",
    "OTHER",
  ]),
  transactionId: z.string().optional(),
  bankName: z.string().optional(),
  chequeNumber: z.string().optional(),
  cardLastFour: z.string().max(4).optional(),
  remarks: z.string().optional(),
});

// Scholarship validation
export const scholarshipSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Scholarship name is required"),
  description: z.string().optional(),

  // Eligibility
  minPercentage: z.number().min(0).max(100).optional(),
  maxFamilyIncome: z.number().min(0).optional(),
  categories: z.array(z.string()).optional(),

  // Benefits
  coverageType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FULL"]),
  coverageAmount: z.number().min(0),
  components: z.array(z.string()).optional(),

  // Validity
  academicYear: z.string().min(1, "Academic year is required"),
  startDate: z.date(),
  endDate: z.date(),
  maxBeneficiaries: z.number().min(1).optional(),

  isActive: z.boolean().default(true),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Scholarship Application validation
export const scholarshipApplicationSchema = z.object({
  id: z.string().optional(),
  studentId: z.string().min(1, "Student is required"),
  scholarshipId: z.string().min(1, "Scholarship is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  familyIncome: z.number().min(0).optional(),
  documents: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
  })).optional(),
  statement: z.string().optional(),
});

// Refund validation
export const refundSchema = z.object({
  id: z.string().optional(),
  paymentId: z.string().min(1, "Payment is required"),
  studentId: z.string().min(1, "Student is required"),
  amount: z.number().min(0.01, "Refund amount must be greater than 0"),
  reason: z.string().min(10, "Please provide a detailed reason"),
  supportingDocs: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
  })).optional(),
});

// Fine validation
export const fineSchema = z.object({
  id: z.string().optional(),
  studentId: z.string().min(1, "Student is required"),
  fineType: z.enum([
    "LATE_FEE",
    "LIBRARY_FINE",
    "DISCIPLINE_FINE",
    "DAMAGE_FINE",
    "OTHER",
  ]),
  amount: z.number().min(0.01, "Fine amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  dueDate: z.date(),
});

// Bulk fee assignment
export const bulkFeeAssignmentSchema = z.object({
  feeStructureId: z.string().min(1, "Fee structure is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  classId: z.string().optional(),
  studentIds: z.array(z.string()).min(1, "Select at least one student"),
});

// Payment receipt
export const paymentReceiptSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  email: z.string().email().optional(),
  sendEmail: z.boolean().default(false),
});

// Fee reminder
export const feeReminderSchema = z.object({
  studentIds: z.array(z.string()).min(1, "Select at least one student"),
  reminderType: z.enum(["EMAIL", "SMS", "BOTH"]),
  message: z.string().min(10, "Message is required"),
  includeAmount: z.boolean().default(true),
  includeDueDate: z.boolean().default(true),
});

// Export types
export type FeeStructureFormData = z.infer<typeof feeStructureSchema>;
export type FeeAssignmentFormData = z.infer<typeof feeAssignmentSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type ScholarshipFormData = z.infer<typeof scholarshipSchema>;
export type ScholarshipApplicationFormData = z.infer<typeof scholarshipApplicationSchema>;
export type RefundFormData = z.infer<typeof refundSchema>;
export type FineFormData = z.infer<typeof fineSchema>;
export type BulkFeeAssignmentFormData = z.infer<typeof bulkFeeAssignmentSchema>;
export type PaymentReceiptFormData = z.infer<typeof paymentReceiptSchema>;
export type FeeReminderFormData = z.infer<typeof feeReminderSchema>;