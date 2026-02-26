// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { getDictionary } from "@/components/internationalization/dictionaries"

const defaultFaqs = [
  {
    question: "What's included in the One Project plan?",
    answer:
      "The One Project plan includes complete custom development for a single automation solution, including consultation, development, testing, and deployment.",
  },
  {
    question: "How does the hourly billing work for Strategic Partner?",
    answer:
      "With Strategic Partner, you get access to our development team at $10/hour. Perfect for ongoing projects, maintenance, or when you need flexible development resources.",
  },
  {
    question: "Can I switch between plans?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
  },
  {
    question: "Do you offer enterprise solutions?",
    answer:
      "Absolutely! For enterprise needs, we offer custom solutions with dedicated teams, SLAs, and specialized support. Contact us for a tailored quote.",
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
