// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { getDictionary } from "@/components/internationalization/dictionaries"

// English fallbacks mirroring marketing.pricing.faqs.questions — the
// dictionary version is what renders in production.
const defaultFaqs = [
  {
    question: 'What counts as a "student"?',
    answer:
      "Any student profile with an active enrollment in your school. Graduated, withdrawn, or archived students don't count toward your plan's student count.",
  },
  {
    question: "How does per-student billing work?",
    answer:
      "Pro is $1.50 per enrolled student per month (minimum $30/mo), billed monthly based on your active student count. Enterprise is $1.00 per student per month, custom-priced for networks of 1,000+ students.",
  },
  {
    question: "Is the free plan really free?",
    answer:
      "Yes. Free is $0 forever for up to 100 students — no trial period, no credit card, no feature lock. Upgrade to Pro only when you outgrow it.",
  },
  {
    question: "Can I cancel or export my data?",
    answer:
      "Cancel anytime from your billing settings — no exit fees. Every record exports to CSV or JSON whenever you want, so your data is never locked in.",
  },
]

interface PricingFAQsProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export default function PricingFAQs({ dictionary }: PricingFAQsProps) {
  const pricing = dictionary?.marketing?.pricing
  const faqs = pricing?.faqs?.questions || defaultFaqs

  return (
    <section className="scroll-py-16 py-16 md:scroll-py-32 md:py-32">
      <div className="flex w-full max-w-6xl">
        <div className="grid gap-x-32 gap-y-12 px-2 lg:[grid-template-columns:1fr_auto]">
          <div className="text-center lg:text-start">
            <h1 className="font-heading mb-4 text-4xl font-extrabold md:text-5xl">
              {pricing?.faqs?.title || (
                <>
                  Frequently <br className="hidden lg:block" /> Asked{" "}
                  <br className="hidden lg:block" />
                  Questions
                </>
              )}
            </h1>
            <p className="muted">
              {pricing?.faqs?.subtitle ||
                "Your guide to pricing and plans with Databayt."}
            </p>
          </div>

          <div className="divide-y divide-dashed sm:mx-auto sm:max-w-2xl lg:mx-0">
            {faqs.map((faq, index) => (
              <div key={index} className={index === 0 ? "pb-6" : "py-6"}>
                <h3>{faq.question}</h3>
                <p className="text-muted-foreground mt-4">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
