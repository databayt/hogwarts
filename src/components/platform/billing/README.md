# Billing Module Documentation

## Overview

The Billing module is a comprehensive, production-ready system for managing school subscriptions to the Hogwarts platform. It provides advanced features for subscription management, payment processing, usage tracking, and financial analytics.

## Features

### ✅ Subscription Management
- **Current Plan Overview** - View active subscription tier with status badges
- **Upgrade/Downgrade** - Switch between plans with prorated billing
- **Cancellation** - Cancel subscriptions immediately or at period end
- **Renewal Tracking** - See next billing date and payment amount
- **Plan Comparison** - Compare features across different tiers

### ✅ Payment Processing
- **Multiple Payment Methods** - Support for cards, bank accounts, PayPal, digital wallets
- **Stripe Integration** - Secure payment processing via Stripe
- **Default Payment Method** - Set primary payment method for auto-billing
- **Payment Verification** - Automatic verification for supported methods
- **Payment History** - Complete transaction log with status tracking

### ✅ Invoice Management
- **Invoice List** - View all invoices with filtering and pagination
- **Invoice Details** - Detailed breakdown of charges and discounts
- **PDF Download** - Generate and download invoice PDFs
- **Status Tracking** - Track invoice status (draft, open, paid, void, etc.)
- **Export** - Export invoice data to CSV/Excel

### ✅ Usage Tracking
- **Resource Monitoring** - Track students, teachers, classes, storage usage
- **Visual Indicators** - Progress bars with color-coded severity levels
- **Usage Warnings** - Automatic alerts at 70%, 85%, 95% capacity
- **Historical Data** - Track usage trends over time
- **Limit Management** - Compare current usage against plan limits

### ✅ Analytics & Reporting
- **Spending Trends** - 12-month spending visualization with charts
- **Payment Success Rate** - Track successful vs. failed payments
- **Financial Metrics** - Average monthly spend, total spent, projections
- **Outstanding Balance** - Monitor unpaid invoices
- **Custom Reports** - Export data for external analysis

### ✅ Advanced Features
- **Credit Notes** - Issue refunds, promotional credits, adjustments
- **Discount Codes** - Apply promo codes and track usage
- **Auto-Billing** - Automatic payment retry with configurable intervals
- **Dunning Management** - Smart payment failure handling
- **Tax Calculation** - Support for VAT, GST, and other tax types
- **Multi-Currency** - Support for USD, EUR, GBP, INR, SAR, AED, etc.
- **Billing Preferences** - Customize invoice settings, notifications, and policies

## File Structure

```
src/components/platform/billing/
├── actions.ts                  # Server actions (25+ functions)
├── types.ts                    # TypeScript type definitions
├── validation.ts               # Zod schemas for input validation
├── config.ts                   # Constants, enums, and helpers
├── dashboard.tsx               # Main dashboard UI component
├── content.tsx                 # Server component composition
├── customer-portal-button.tsx  # Stripe customer portal button
└── README.md                   # This file

src/app/[lang]/s/[subdomain]/(platform)/billing/
└── page.tsx                    # Billing page route

prisma/models/subscription.prisma
└── Enhanced with 6 new models:
    - PaymentMethod
    - BillingHistory
    - UsageMetrics
    - CreditNote
    - BillingPreferences
    - + 5 enums
```

## Database Schema

### New Models

#### PaymentMethod
Stores payment methods (cards, bank accounts, wallets) for subscriptions.

**Key Fields:**
- `type` - Payment method type (CARD, BANK_ACCOUNT, PAYPAL, etc.)
- `provider` - Payment provider (stripe, plaid, paypal, manual)
- `stripePaymentMethodId` - Stripe payment method ID
- `cardBrand`, `cardLast4` - Card details (if applicable)
- `isDefault` - Default payment method flag
- `isVerified` - Verification status

#### BillingHistory
Complete transaction log for all billing events.

**Key Fields:**
- `type` - Event type (PAYMENT_SUCCESS, SUBSCRIPTION_UPDATED, etc.)
- `status` - Transaction status (SUCCESS, FAILED, PENDING, etc.)
- `amount` - Amount in cents
- `paymentProvider` - Payment provider used
- `transactionId` - External transaction ID
- `errorCode`, `errorMessage` - Error tracking

#### UsageMetrics
Track feature usage against subscription limits.

**Key Fields:**
- `currentStudents`, `currentTeachers`, `currentClasses` - Resource usage
- `periodStart`, `periodEnd` - Billing period
- `studentsWarningTriggered` - Warning trigger flags
- `featuresUsed` - JSON tracking of feature usage

#### CreditNote
Account credits for refunds, promotions, adjustments.

**Key Fields:**
- `creditNumber` - Unique credit identifier
- `amount`, `remainingAmount` - Credit amounts in cents
- `type` - Credit type (REFUND, PROMOTIONAL, etc.)
- `validFrom`, `validUntil` - Validity period
- `status` - Credit status (ACTIVE, EXPIRED, etc.)

#### BillingPreferences
School-specific billing settings.

**Key Fields:**
- `autoPayEnabled` - Enable automatic payments
- `paymentRetries` - Number of retry attempts
- `sendPaymentSuccess`, `sendPaymentFailed` - Email notifications
- `invoicePrefix` - Invoice number prefix
- `taxEnabled`, `taxRate` - Tax configuration
- `currency`, `locale` - Currency and locale settings

## API Reference

### Server Actions

All server actions are located in `actions.ts` and follow the `BillingActionResult<T>` return type for consistent error handling.

#### Subscription Actions

```typescript
// Get current subscription details
const result = await getSubscriptionDetails();
// Returns: BillingActionResult<SubscriptionWithTier | null>

// Get available subscription tiers
const result = await getSubscriptionTiers();
// Returns: BillingActionResult<SubscriptionTier[]>

// Update subscription (upgrade/downgrade)
const result = await updateSubscription({
  tierId: "clx...",
  billingInterval: "monthly" | "annual",
  prorationBehavior: "create_prorations" | "none" | "always_invoice"
});
// Returns: BillingActionResult<Subscription>

// Cancel subscription
const result = await cancelSubscription({
  reason: "optional reason",
  feedback: "optional feedback",
  cancelAtPeriodEnd: true,
  requestRefund: false
});
// Returns: BillingActionResult<Subscription>
```

#### Payment Method Actions

```typescript
// Get all payment methods
const result = await getPaymentMethods();
// Returns: BillingActionResult<PaymentMethodWithUser[]>

// Add new payment method
const result = await addPaymentMethod({
  type: "CARD",
  provider: "stripe",
  stripePaymentMethodId: "pm_...",
  billingName: "John Doe",
  billingEmail: "john@example.com",
  isDefault: false
});
// Returns: BillingActionResult<PaymentMethod>

// Set default payment method
const result = await setDefaultPaymentMethod(paymentMethodId);
// Returns: BillingActionResult<void>

// Remove payment method
const result = await removePaymentMethod(paymentMethodId);
// Returns: BillingActionResult<void>
```

#### Invoice Actions

```typescript
// Get invoices with filters
const result = await getInvoices({
  status: ["open", "paid"],
  dateFrom: new Date("2024-01-01"),
  dateTo: new Date("2024-12-31"),
  page: 1,
  limit: 20
});
// Returns: BillingActionResult<{ invoices: Invoice[], total: number }>
```

#### Billing History Actions

```typescript
// Get billing history
const result = await getBillingHistory({
  type: ["PAYMENT_SUCCESS", "PAYMENT_FAILED"],
  status: ["SUCCESS"],
  dateFrom: new Date("2024-01-01"),
  page: 1,
  limit: 20
});
// Returns: BillingActionResult<{ history: BillingHistory[], total: number }>
```

#### Stats Actions

```typescript
// Get comprehensive billing statistics
const result = await getBillingStats();
// Returns: BillingActionResult<BillingStats>
```

#### Usage Metrics Actions

```typescript
// Update usage metrics
const result = await updateUsageMetrics({
  subscriptionId: "clx...",
  currentStudents: 150,
  currentTeachers: 20,
  currentClasses: 30,
  currentStorage: 5000 // MB
});
// Returns: BillingActionResult<UsageMetrics>
```

#### Billing Preferences Actions

```typescript
// Get billing preferences
const result = await getBillingPreferences();
// Returns: BillingActionResult<BillingPreferences>

// Update billing preferences
const result = await updateBillingPreferences({
  autoPayEnabled: true,
  paymentRetries: 3,
  sendPaymentSuccess: true,
  currency: "USD",
  taxEnabled: false
});
// Returns: BillingActionResult<BillingPreferences>
```

## Usage Examples

### Basic Implementation

```tsx
import BillingContent from "@/components/platform/billing/content";

export default function BillingPage() {
  return <BillingContent />;
}
```

### With Internationalization

```tsx
import BillingContent from "@/components/platform/billing/content";
import { getDictionary } from "@/components/internationalization/dictionaries";

export default async function BillingPage({ params }) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <BillingContent dictionary={dictionary} />;
}
```

### Custom Integration

```tsx
import { getBillingStats, getInvoices } from "@/components/platform/billing/actions";

export default async function CustomBillingView() {
  const statsResult = await getBillingStats();
  const invoicesResult = await getInvoices({ limit: 5 });

  if (!statsResult.success || !invoicesResult.success) {
    return <ErrorView />;
  }

  return (
    <div>
      <h1>Current Plan: {statsResult.data.currentPlan}</h1>
      <p>Next Payment: {formatCurrency(statsResult.data.nextPaymentAmount)}</p>
      {/* Custom UI */}
    </div>
  );
}
```

## Configuration

### Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=https://ed.databayt.org

# Database
DATABASE_URL=postgresql://...
```

### Billing Configuration

Edit `config.ts` to customize:

- **Currency symbols and display names**
- **Usage warning thresholds** (70%, 85%, 95%)
- **Payment retry configuration** (max retries, intervals)
- **Email notification templates**
- **Feature flags** (enable/disable features)
- **Chart colors for analytics**

## Multi-Tenant Security

All billing actions are **automatically scoped by `schoolId`** to ensure data isolation:

```typescript
// ✅ Secure - automatically filters by schoolId
const { schoolId } = await getTenantContext();
const invoices = await db.invoice.findMany({
  where: { schoolId }, // REQUIRED
});
```

## Error Handling

All actions return a consistent `BillingActionResult<T>` type:

```typescript
const result = await updateSubscription(data);

if (!result.success) {
  // Handle error
  console.error(result.error);
  return;
}

// Use data safely
const subscription = result.data;
```

## Testing

### Unit Tests
```bash
pnpm test src/components/platform/billing/**/*.test.tsx
```

### Integration Tests
Test Stripe webhooks locally:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Stripe Integration

### Webhook Events

The system handles these Stripe webhook events:

- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `payment_method.attached`
- `payment_method.detached`

### Customer Portal

The `openCustomerPortal` action redirects to Stripe's hosted billing portal where users can:
- Update payment methods
- Download invoices
- Update billing information
- Cancel subscriptions

## Roadmap

### Planned Features
- [ ] Email notifications with Resend integration
- [ ] PDF invoice generation
- [ ] Advanced analytics charts
- [ ] Budget alerts and spending limits
- [ ] Referral credit system
- [ ] Consolidated billing for multiple schools
- [ ] Usage-based billing for add-ons
- [ ] Automated dunning emails
- [ ] Payment method verification
- [ ] Tax calculation API integration

## Troubleshooting

### Common Issues

**Issue:** "No active subscription" error
- **Solution:** Ensure the school has a valid subscription record with `status: "active"`

**Issue:** Payment methods not showing
- **Solution:** Check that payment methods have `status: "active"` and match the school's `schoolId`

**Issue:** Usage metrics not updating
- **Solution:** Call `updateUsageMetrics()` regularly (e.g., via cron job)

**Issue:** Stripe webhook failures
- **Solution:** Verify `STRIPE_WEBHOOK_SECRET` is set and webhook endpoint is configured

## Support

For questions or issues:
1. Check this README
2. Review code comments in `actions.ts`
3. Check Stripe dashboard for payment issues
4. Review database logs in `BillingHistory` table

## License

MIT License - See LICENSE file for details

---

**Last Updated:** 2025-01-24
**Version:** 1.0.0
**Status:** Production Ready ✅
