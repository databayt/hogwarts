import PricingHeader from "@/components/marketing/pricing/pricing-header"
import PricingPlans from "@/components/marketing/pricing/pricing-plans"
import ComparisonTable from "@/components/marketing/pricing/comparison-table"
import PricingFAQs from "@/components/marketing/pricing/pricing-faqs"
import EnterpriseSection from "@/components/marketing/pricing/enterprise-section"

export const metadata = {
  title: "Pricing",
}

export default function PricingPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-8 md:pb-12 lg:pb-24">
      <PricingHeader />
      <PricingPlans />
      <ComparisonTable />
      <PricingFAQs />
      <EnterpriseSection />
      
      <div className="flex w-full max-w-4xl flex-col gap-4">
        {/* <p className="max-w-[85%] leading-normal text-muted-foreground sm:leading-7">
          Taxonomy is a demo app.{" "}
          <strong>You can test the upgrade and won&apos;t be charged.</strong>
        </p> */}
      </div>
    </section>
  )
}
