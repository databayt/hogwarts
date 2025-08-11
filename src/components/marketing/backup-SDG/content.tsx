import PricingHeader from "@/components/marketing/backup-SDG/pricing-header"
import PricingPlans from "@/components/marketing/backup-SDG/pricing-plans"
import ComparisonTable from "@/components/marketing/backup-SDG/comparison-table"
import PricingFAQs from "@/components/marketing/backup-SDG/pricing-faqs"
import EnterpriseSection from "@/components/marketing/backup-SDG/enterprise-section"


export default function PricingContent() {
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
