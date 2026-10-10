// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { getDictionary } from "@/components/internationalization/dictionaries"

// English fallbacks mirroring marketing.pricing.faqs.questions — the
// dictionary version is what renders in production.
const defaultFaqs = [
  {
    question: "How is the price calculated?",
    answer:
      "Every student weighs the same: 24 SAR a year. Your first 100 students are free, so a school of 300 pays for 200 students — 4,800 SAR a year.",
  },
  {
    question: 'What counts as a "student"?',
    answer:
      "Any student profile with an active enrollment in your school. Graduated, withdrawn, or archived students don't count.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. Every school gets a full three-month free trial, and the first 100 students stay free forever after it.",
  },
  {
    question: "How do I pay?",
    answer:
      "One annual price: half at signing, the rest in four quarterly instalments of 12.5%. Prices exclude VAT.",
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
