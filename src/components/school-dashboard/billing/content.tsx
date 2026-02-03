import { type Locale } from "@/components/internationalization/config"
import { type getDictionary } from "@/components/internationalization/dictionaries"

import { BillingSettings2Demo } from "./billing-settings-2-demo"
import { BillingSettingsDemo } from "./billing-settings-demo"
import { DetailedUsageTableDemo } from "./detailed-usage-table-demo"
import { InvoiceHistoryDemo } from "./invoice-history-demo"
import { PaymentCardDemo } from "./payment-card-demo"
import { PaymentMethodSelectorDemo } from "./payment-method-selector-demo"
import { SubscriptionManagementDemo } from "./subscription-management-demo"
import { TrialExpiryCardDemo } from "./trial-expiry-card-demo"
import { UpcomingChargesDemo } from "./upcoming-charges-demo"
import { UpdatePlanCardDemo } from "./update-plan-card-demo"
import { UsageBasedPricingDemo } from "./usage-based-pricing-demo"

interface BillingContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export default function BillingContent(_props: BillingContentProps) {
  return (
    <div className="flex flex-col gap-8 py-4 pb-14">
      {/* Section 1: Subscription Overview (1 column - full width) */}
      <section>
        <SubscriptionManagementDemo />
      </section>

      {/* Section 2: Plan & Trial Cards (2 columns) */}
      <section className="grid gap-6 md:grid-cols-2">
        <UpdatePlanCardDemo />
        <TrialExpiryCardDemo />
      </section>

      {/* Section 3: Usage & Charges (2 columns) */}
      <section className="grid gap-6 md:grid-cols-2">
        <UsageBasedPricingDemo />
        <UpcomingChargesDemo />
      </section>

      {/* Section 4: Usage Table (1 column - full width) */}
      <section>
        <DetailedUsageTableDemo />
      </section>

      {/* Section 5: Invoice History (1 column - full width) */}
      <section>
        <InvoiceHistoryDemo />
      </section>

      {/* Section 6: Payment Methods (2 columns) */}
      <section className="grid gap-6 md:grid-cols-2">
        <PaymentMethodSelectorDemo />
        <PaymentCardDemo />
      </section>

      {/* Section 7: Billing Settings (2 columns) */}
      <section className="grid gap-6 md:grid-cols-2">
        <BillingSettingsDemo />
        <BillingSettings2Demo />
      </section>
    </div>
  )
}
