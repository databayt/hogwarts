// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { getDictionary } from "@/components/internationalization/dictionaries"

// English fallbacks mirroring marketing.pricing.faqs.questions — the
// dictionary version is what renders in production.
const defaultFaqs = [
  {
    question: "How is the price calculated?",
    answer:
      "Every student weighs the same: 24 SAR (about $6.40) a year, from the first student. A school of 300 pays 7,200 SAR a year.",
  },
  {
    question: 'What counts as a "student"?',
    answer:
      "Any student profile with an active enrollment in your school. Graduated, withdrawn, or archived students don't count.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. Every new school gets its first month free — no fees, no commitment.",
  },
  {
    question: "How do I pay?",
    answer:
      "One annual price: half when the free month ends, the rest in four quarterly instalments of 12.5%. Schools in Sudan pay the US-dollar price in Sudanese pounds, at the bank rate on the day, by bank transfer. Prices exclude VAT.",
  },
]

interface PricingFAQsProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

// Same layout as the home page FAQ (saas-marketing/faqs.tsx): full-width
// 1fr/2fr grid so its edges line up with the sections above, accordion
// answers, first item open.
export default function PricingFAQs({ dictionary }: PricingFAQsProps) {
  const pricing = dictionary?.marketing?.pricing
  const faqs = pricing?.faqs?.questions || defaultFaqs
  const title = pricing?.faqs?.title || "Frequently Asked Questions"
  const titleBreak = dictionary?.marketing?.faqs?.titleBreak || title

  return (
    <section className="w-full py-16 md:py-32">
      <div className="grid gap-y-12 lg:grid-cols-[1fr_2fr] lg:gap-x-12">
        <div className="text-center lg:text-start">
          <h1 className="font-heading mb-4 text-4xl font-extrabold whitespace-pre-line md:text-5xl">
            <span className="md:hidden">{title}</span>
            <span className="hidden md:inline">{titleBreak}</span>
          </h1>
          <p className="muted">
            {pricing?.faqs?.subtitle ||
              "Your guide to per-student pricing with Balqalam."}
          </p>
        </div>
        <div className="sm:mx-auto sm:max-w-xl lg:mx-0 lg:ms-auto">
          <Accordion type="single" collapsible defaultValue="item-0">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-start">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-start">
                  <p className="muted">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
