# Issues - Billing Component

## 🔴 Critical Issues (Fix Immediately)

### 1. Missing Server Component Implementation

**Problem**: No `content.tsx` server component exists. The main composition is missing.

**Impact**:

- Cannot properly fetch and display billing data
- No server-side data fetching
- Missing i18n dictionary support

**Solution**:

```typescript
// Create billing/content.tsx
export default async function BillingContent({
  dictionary,
  lang
}: BillingContentProps) {
  const [invoices, receipts, stats] = await Promise.all([
    db.invoice.findMany({
      include: { school: true, receipts: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
    db.receipt.findMany({
      where: { status: 'pending' },
      include: { invoice: true }
    }),
    getBillingStatistics()
  ]);

  return (
    <div className="flex-1 space-y-6 p-8">
      <h1>{dictionary.title}</h1>
      <BillingStats stats={stats} />
      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">{dictionary.invoices}</TabsTrigger>
          <TabsTrigger value="receipts">{dictionary.receipts}</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices">
          <InvoiceTable data={invoices} />
        </TabsContent>
        <TabsContent value="receipts">
          <ReceiptTable data={receipts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 2. Type Assertions with 'unknown'

**Location**: Server actions using Prisma

**Current**:

```typescript
// Unsafe type assertion
{ where: { id }, data: { status } } as unknown as Prisma.InvoiceUpdateArgs
```

**Fix**:

```typescript
// Type-safe approach
const updateArgs = {
  where: { id },
  data: { status },
} satisfies Prisma.InvoiceUpdateArgs

await db.invoice.update(updateArgs)
```

### 3. No Stripe Webhook Handler

**Problem**: Missing webhook endpoint for Stripe events

**Create**: `app/api/webhooks/stripe/route.ts`

```typescript
import { headers } from "next/headers"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_API_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new Response("Webhook signature verification failed", {
      status: 400,
    })
  }

  switch (event.type) {
    case "invoice.payment_succeeded":
      await handlePaymentSuccess(event.data.object)
      break
    case "invoice.payment_failed":
      await handlePaymentFailure(event.data.object)
      break
    // ... other events
  }

  return new Response(null, { status: 200 })
}
```

## 🟡 High Priority Issues (Fix Soon)

### 4. Client Component Should Be Server Component

**Location**: Main billing component wrapper

**Problem**: Unnecessary client-side rendering for data fetching

**Solution**: Convert to server component pattern as shown in Critical Issue #1

### 5. Missing Error Boundaries

**Problem**: No error handling for failed data fetches

**Add**:

```typescript
// billing/error.tsx
'use client';

export default function BillingError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error loading billing data</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
      <Button onClick={reset} variant="outline" size="sm">
        Try again
      </Button>
    </Alert>
  );
}
```

### 6. No Loading States

**Problem**: Missing skeleton loaders

**Create**: `billing/loading.tsx`

```typescript
export default function BillingLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}
```

### 7. Inefficient Data Fetching

**Problem**: No pagination, fetching all records

**Solution**:

```typescript
// Implement cursor-based pagination
export async function getInvoices({
  cursor,
  limit = 20,
  filters,
}: InvoiceQueryParams) {
  return db.invoice.findMany({
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where: filters,
    orderBy: { createdAt: "desc" },
  })
}
```

### 8. Missing Transaction Support

**Problem**: Multi-step operations not atomic

**Fix**:

```typescript
export async function approveReceipt(receiptId: string) {
  return db.$transaction(async (tx) => {
    const receipt = await tx.receipt.update({
      where: { id: receiptId },
      data: { status: "approved" },
    })

    await tx.invoice.update({
      where: { id: receipt.invoiceId },
      data: { status: "paid" },
    })

    await tx.auditLog.create({
      data: {
        action: "RECEIPT_APPROVED",
        entityId: receiptId,
        userId: session.user.id,
      },
    })

    return receipt
  })
}
```

## 🟢 Low Priority Issues (Nice to Have)

### 9. No Export Functionality

**Problem**: Cannot export invoices to CSV/PDF

**Implement**:

```typescript
export async function exportInvoices(format: "csv" | "pdf") {
  const invoices = await db.invoice.findMany({
    /* ... */
  })

  if (format === "csv") {
    return generateCSV(invoices)
  } else {
    return generatePDF(invoices)
  }
}
```

### 10. Missing Search Functionality

**Problem**: No full-text search for invoices

**Add**:

```typescript
// Use PostgreSQL full-text search
export async function searchInvoices(query: string) {
  return db.$queryRaw`
    SELECT * FROM invoices
    WHERE to_tsvector('english', number || ' ' || school_name)
    @@ plainto_tsquery('english', ${query})
  `
}
```

### 11. No Bulk Operations

**Problem**: Cannot perform bulk actions on invoices

**Implement**:

```typescript
export async function bulkUpdateStatus(
  invoiceIds: string[],
  status: InvoiceStatus
) {
  return db.invoice.updateMany({
    where: { id: { in: invoiceIds } },
    data: { status },
  })
}
```

### 12. Missing Charts/Analytics

**Problem**: No visual representation of financial data

**Add**: Revenue charts, payment trends, overdue analysis

## TypeScript Issues

### Missing Type Safety

- No branded types for IDs and amounts
- Missing discriminated unions for status
- No Result type pattern for errors

**Implement**:

```typescript
// Branded types
type InvoiceId = string & { __brand: "InvoiceId" }
type Amount = number & { __brand: "Amount" }

// Result pattern
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }
```

## UI/UX Issues

### Accessibility Problems

- Missing ARIA labels on status badges
- No keyboard navigation for bulk selection
- Color-only status indicators (need icons too)

### Responsive Design

- Table not optimized for mobile
- No horizontal scroll on small screens
- Card grid doesn't stack properly

### Dark Mode Issues

- Chart colors not theme-aware
- Status badge colors hard to distinguish
- Table borders too subtle in dark mode

## Performance Issues

### Database Queries

- No connection pooling specific to billing
- Missing database indexes on frequently queried fields
- N+1 query problems with relations

**Add indexes**:

```sql
CREATE INDEX idx_invoices_school_created ON invoices(schoolId, createdAt DESC);
CREATE INDEX idx_invoices_status WHERE status IN ('open', 'overdue');
CREATE INDEX idx_receipts_pending ON receipts(status) WHERE status = 'pending';
```

### Client-Side Performance

- Large data tables causing lag
- No virtualization for long lists
- Missing React.memo on expensive components

## Security Vulnerabilities

### Missing Rate Limiting

**Add rate limits**:

```typescript
const rateLimits = {
  createInvoice: "100/hour",
  approveReceipt: "500/hour",
  exportData: "10/hour",
}
```

### No Audit Trail

**Every financial operation needs audit logging**:

```typescript
await auditLog({
  action: "INVOICE_CREATED",
  entityType: "invoice",
  entityId: invoice.id,
  metadata: { amount, schoolId },
  userId: session.user.id,
  ip: request.ip,
})
```

### Missing Input Validation

**Enhance Zod schemas**:

```typescript
const amountSchema = z
  .number()
  .positive("Amount must be positive")
  .int("Amount must be in cents")
  .max(100000000, "Amount exceeds maximum")
  .refine((val) => val % 1 === 0, "Must be whole cents")
```

## Testing Gaps

Missing test coverage for:

- Stripe webhook processing
- Currency conversion
- Tax calculations
- Receipt approval workflow
- Bulk operations
- Export functionality

## Migration Plan

### Week 1: Critical Fixes

1. Create server component structure
2. Fix type assertions
3. Implement Stripe webhooks
4. Add error boundaries

### Week 2: Core Features

1. Add pagination
2. Implement transactions
3. Create loading states
4. Add audit logging

### Week 3: Enhancements

1. Export functionality
2. Search capability
3. Bulk operations
4. Analytics charts

### Week 4: Polish

1. Fix accessibility issues
2. Optimize performance
3. Add comprehensive tests
4. Update documentation

## Dependencies to Add

```json
{
  "stripe": "^18.4.0",
  "@react-pdf/renderer": "^3.4.0",
  "papaparse": "^5.4.0",
  "recharts": "^2.15.0"
}
```

## Related Issues

- [Server Actions Issues](../actions/ISSUE.md)
- [TypeScript Issues](../types/ISSUE.md)
- [Dashboard Integration](../dashboard/ISSUE.md)
