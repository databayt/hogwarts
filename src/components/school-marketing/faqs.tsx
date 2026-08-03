"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useDictionary } from "@/components/internationalization/use-dictionary"

export default function FAQs() {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.faqs
  if (!t) return null

  const questions = t.questions ?? []

  return (
    <section className="section-y">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
          <h2 className="display-2">{t.title}</h2>
          <p className="display-intro mt-4">{t.subtitle}</p>
        </div>

        <div className="lg:col-span-7">
          <Accordion type="single" collapsible>
            {questions.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-start">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-start">
                  <p className="text-muted-foreground">{faq.answer}</p>
                  {faq.listItems && faq.listItems.length > 0 && (
                    <ul className="text-muted-foreground mt-4 list-outside list-disc space-y-2 ps-4">
                      {faq.listItems.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
