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

export default function BillingContent({ dictionary, lang }: BillingContentProps) {
  return (
    <>
      <DashboardHeader heading="Billing" text="Manage your subscription, payments, and billing settings." />
      <div className="flex flex-col gap-6 py-4 pb-14">
        {/* Subscription & Plan Management */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SubscriptionManagementDemo />
          <UpdatePlanCardDemo />
        </div>

        {/* Trial & Pricing */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TrialExpiryCardDemo />
          <UsageBasedPricingDemo />
        </div>

        {/* Usage & Charges */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DetailedUsageTableDemo />
          <UpcomingChargesDemo />
        </div>

        {/* Invoice History - Full Width */}
        <InvoiceHistoryDemo />

        {/* Payment Methods */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PaymentMethodSelectorDemo />
          <PaymentCardDemo />
        </div>

        {/* Billing Settings */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BillingSettingsDemo />
          <BillingSettings2Demo />
        </div>
      </div>
    </>
  );
}
