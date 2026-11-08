// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { FaqBlock } from "@/components/saas-marketing/thmanyah/block/FaqBlock"

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
  lang?: Locale
}

// The home page FAQ block (thmanyah FaqBlock) with the pricing questions:
// three columns, the title heads the first. Horizontal padding comes off so
// its edges sit on the same gutter as the cards and compare table above.
export default function PricingFAQs({
  dictionary,
  lang = "en",
}: PricingFAQsProps) {
  const pricing = dictionary?.marketing?.pricing
  const faqs = pricing?.faqs?.questions || defaultFaqs
  const words = (pricing?.faqs?.title || "Frequently Asked Questions").split(
    " "
  )
  const mark = words.pop() ?? ""

  const perColumn = Math.ceil(faqs.length / 3)
  const columns = [0, 1, 2].map((c) =>
    faqs
      .slice(c * perColumn, (c + 1) * perColumn)
      .map((f) => ({ q: f.question, a: [f.answer] }))
  )

  return (
    <FaqBlock
      lang={lang}
      faq={{
        titleLine1: words.join(" "),
        titleLine2Lead: "",
        titleLine2Mark: mark,
        columns,
      }}
      className={cn(
        "px-0!",
        // Lift the 348px text cap so each column fills its share and the
        // text sits on the same edges as the cards above.
        "[&_.faq-head]:max-w-none! [&_.faq-item]:max-w-none!",
        // .thmanyah-shell[dir=ltr] left-aligns these on the home page; the
        // pricing page has no shell, so English sets it here.
        lang === "en" && "[&_.faq-q]:text-left! [&_.faq-title]:text-left!"
      )}
    />
  )
}
