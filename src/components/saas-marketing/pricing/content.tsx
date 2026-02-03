import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { currentUser } from "@/components/auth/auth"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { ComparePlans } from "@/components/saas-marketing/pricing/compare-plans"
import { getUserSubscriptionPlan } from "@/components/saas-marketing/pricing/lib/subscription"
import {
  cn,
  constructMetadata,
} from "@/components/saas-marketing/pricing/lib/utils"
import { PricingCards } from "@/components/saas-marketing/pricing/pricing-cards"
import { PricingFaq } from "@/components/saas-marketing/pricing/pricing-faq"
import { Callout } from "@/components/saas-marketing/pricing/shared/callout"

import EnterpriseSection from "./enterprise-section"
import PricingLoaderOverlay from "./loader-overlay"
import PricingFAQs from "./pricing-faqs"
import PricingHeader from "./pricing-header"
import { SecurePayment } from "./secure-payment"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export default async function PricingContent(props: Props) {
  const { lang } = props

  // Safely get user and subscription - don't crash if auth/db fails
  let user = null
  let subscriptionPlan = undefined

  try {
    user = await currentUser()
    if (user?.id) {
      subscriptionPlan = await getUserSubscriptionPlan(user.id)
    }
  } catch (error) {
    // Log but continue - pricing page should work for anonymous users
    console.error("Failed to get user/subscription:", error)
  }

  return (
    <div className="flex w-full flex-col items-center py-14">
      <PricingLoaderOverlay />
      <PricingHeader />
      <PricingCards
        userId={user?.id}
        subscriptionPlan={subscriptionPlan}
        userRole={user?.role}
        lang={lang}
      />
      <ComparePlans />
      <SecurePayment />
      {/* <PricingFaq /> */}
      <PricingFAQs />
      <EnterpriseSection lang={lang} />
    </div>
  )
}
