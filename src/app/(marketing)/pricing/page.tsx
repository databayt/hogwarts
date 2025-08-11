import { getCurrentUser } from "@/components/marketing/pricing/lib/session";
import { getUserSubscriptionPlan } from "@/components/marketing/pricing/lib/subscription";
import { Callout } from "@/components/marketing/pricing/shared/callout";
import { constructMetadata } from "@/components/marketing/pricing/lib/utils";
import { ComparePlans } from "@/components/marketing/pricing/pricing/compare-plans";
import { PricingCards } from "@/components/marketing/pricing/pricing/pricing-cards";
import { PricingFaq } from "@/components/marketing/pricing/pricing/pricing-faq";

export const metadata = constructMetadata({
  title: "Pricing – SaaS Starter",
  description: "Explore our subscription plans.",
});

export default async function PricingPage() {
  const user = await getCurrentUser();

  let subscriptionPlan;
  if (user && user.id) {
    subscriptionPlan = await getUserSubscriptionPlan(user.id);
  }

  return (
    <div className="flex w-full flex-col gap-16 py-8 md:py-8">
      {/* Trial / grace period banner (simple example) */}
      <div className="container">
        <Callout type="info">
          <p>
            Free trial available. Upgrade anytime; your current access remains until the
            end of the billing period. Changes are applied at the next cycle.
          </p>
        </Callout>
      </div>
      <PricingCards userId={user?.id} subscriptionPlan={subscriptionPlan} userRole={user?.role} />
      <hr className="container" />
      <ComparePlans />
      <PricingFaq />
    </div>
  );
}
