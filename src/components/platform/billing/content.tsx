import { DashboardHeader } from "@/components/platform/dashboard/header";
import { type Locale } from "@/components/internationalization/config";
import { type getDictionary } from "@/components/internationalization/dictionaries";
import { SubscriptionManagementDemo } from "./subscription-management-demo";
import { UpdatePlanCardDemo } from "./update-plan-card-demo";
import { TrialExpiryCardDemo } from "./trial-expiry-card-demo";
import { UsageBasedPricingDemo } from "./usage-based-pricing-demo";
import { DetailedUsageTableDemo } from "./detailed-usage-table-demo";
import { UpcomingChargesDemo } from "./upcoming-charges-demo";
import { InvoiceHistoryDemo } from "./invoice-history-demo";
import { PaymentMethodSelectorDemo } from "./payment-method-selector-demo";
import { PaymentCardDemo } from "./payment-card-demo";
import { BillingSettingsDemo } from "./billing-settings-demo";
import { BillingSettings2Demo } from "./billing-settings-2-demo";

interface BillingContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
}

export default function BillingContent(_props: BillingContentProps) {
  return (
    <>
      <DashboardHeader heading="Billing" text="BillingSDK components from billingsdk.com" />
      <div className="flex flex-col gap-8 py-4 pb-14">
        {/* Billing 01: Subscription Management */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Subscription Management</h3>
          <SubscriptionManagementDemo />
        </section>

        {/* Billing 02: Update Plan Card */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Update Plan Card</h3>
          <UpdatePlanCardDemo />
        </section>

        {/* Billing 03: Trial Expiry Card */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Trial Expiry Card</h3>
          <TrialExpiryCardDemo />
        </section>

        {/* Billing 04: Usage Based Pricing */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Usage Based Pricing</h3>
          <UsageBasedPricingDemo />
        </section>

        {/* Billing 05: Detailed Usage Table */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Detailed Usage Table</h3>
          <DetailedUsageTableDemo />
        </section>

        {/* Billing 06: Upcoming Charges */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Upcoming Charges</h3>
          <UpcomingChargesDemo />
        </section>

        {/* Billing 07: Invoice History */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Invoice History</h3>
          <InvoiceHistoryDemo />
        </section>

        {/* Billing 08: Payment Method Selector */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Payment Method Selector</h3>
          <PaymentMethodSelectorDemo />
        </section>

        {/* Billing 09: Payment Card */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Payment Card</h3>
          <PaymentCardDemo />
        </section>

        {/* Billing 10: Billing Settings */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Billing Settings</h3>
          <BillingSettingsDemo />
        </section>

        {/* Billing 11: Billing Settings 2 */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Billing Settings (Alternate)</h3>
          <BillingSettings2Demo />
        </section>
      </div>
    </>
  );
}
