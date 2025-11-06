# Receipt Management

Professional receipt generation and tracking system for all financial transactions.

## Overview

The Receipt module automatically generates receipts for payments, provides receipt tracking, and supports various receipt formats (digital, printable, email).

## Key Features

### 1. Automatic Receipt Generation
- Auto-generate on payment confirmation
- Sequential receipt numbering
- QR code for verification
- Digital signature support

### 2. Receipt Formats
- **Digital Receipt**: PDF format with QR code
- **Email Receipt**: HTML email with PDF attachment
- **Printed Receipt**: Thermal printer compatible
- **SMS Receipt**: Text message with receipt number

### 3. Receipt Types
- Fee payment receipts
- Donation receipts (tax-deductible)
- Expense reimbursement receipts
- Refund receipts

### 4. Receipt Management
- Search and filter receipts
- Reprint receipts
- Void receipts (with audit trail)
- Export receipt register

## Data Model

### Receipt
```typescript
{
  id: string
  receiptNumber: string      // Sequential: REC-2024-00001
  receiptDate: Date
  payerName: string
  payerEmail?: string
  amount: Decimal
  paymentMethod: PaymentMethod
  purpose: string
  reference?: string          // Payment reference
  isVoid: boolean
  voidedAt?: Date
  voidReason?: string
  qrCode: string             // QR code data
  pdfUrl?: string            // S3 URL to PDF
}
```

## Server Actions

### Receipt Generation

#### `generateReceiptWithRBAC(paymentId)`
**Permissions Required:** `receipt:create`

**Example:**
```typescript
const result = await generateReceiptWithRBAC(paymentId)

if (result.success && result.data) {
  console.log(`Receipt #${result.data.receiptNumber} generated`)
  // Automatically email to payer
  await emailReceipt(result.data.id, payer.email)
}
```

### Receipt Operations

#### `reprintReceiptWithRBAC(receiptId)`
Regenerates PDF for an existing receipt.

#### `voidReceiptWithRBAC(receiptId, reason)`
Voids a receipt (does not delete, marks as void).

**Example:**
```typescript
await voidReceiptWithRBAC(receiptId, "Payment reversed due to insufficient funds")
```

#### `getReceiptByNumberWithRBAC(receiptNumber)`
Retrieves receipt by receipt number.

## Receipt Template

```
╔══════════════════════════════════════╗
║         SCHOOL NAME                  ║
║         School Address               ║
║         Phone: XXX-XXX-XXXX          ║
╠══════════════════════════════════════╣
║                                      ║
║  RECEIPT                             ║
║                                      ║
║  Receipt #: REC-2024-00123           ║
║  Date: November 15, 2024             ║
║                                      ║
╠══════════════════════════════════════╣
║                                      ║
║  Received From: John Doe             ║
║  Amount: $1,250.00                   ║
║  Payment Method: Bank Transfer       ║
║  Purpose: November Tuition           ║
║  Reference: TXN-789456               ║
║                                      ║
╠══════════════════════════════════════╣
║                                      ║
║  [QR CODE]                           ║
║                                      ║
║  Scan to verify receipt              ║
║                                      ║
╠══════════════════════════════════════╣
║  Authorized Signature: ___________   ║
║                                      ║
║  This is a computer-generated        ║
║  receipt and requires no signature   ║
╚══════════════════════════════════════╝
```

## Integration

- **Fees Module**: Auto-generates receipt on fee payment
- **Invoice Module**: Links receipt to invoice
- **Wallet Module**: Receipts for wallet top-ups
- **Expenses Module**: Receipts for reimbursements

## Best Practices

1. **Immediate Generation**: Generate receipts immediately after payment
2. **Sequential Numbering**: Never skip or reuse receipt numbers
3. **Secure Storage**: Store PDF receipts in encrypted cloud storage
4. **Audit Trail**: Never delete receipts; void if needed
5. **Backup**: Daily backup of receipt database and PDFs

## RBAC

| Role | View | Create | Void | Reprint |
|------|------|--------|------|---------|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ |
| **ACCOUNTANT** | ✅ | ✅ | ✅ | ✅ |
| **GUARDIAN** | ✅ (own) | ❌ | ❌ | ✅ (own) |

## Support

For questions: finance@school.edu
