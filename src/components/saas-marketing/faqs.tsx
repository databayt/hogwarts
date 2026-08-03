"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface FAQsProps {
  dictionary?: Dictionary
  lang?: Locale
}

export default function FAQs({ dictionary, lang }: FAQsProps) {
  const isRTL = lang === "ar"
  const faqsDict = dictionary?.marketing?.faqs || {
    title: "Frequently Asked Questions",
    titleBreak: "FAQ",
    subtitle: "Everything you need to know.",
    items: [],
  }

  const defaultItems = [
    {
      question: "What do you offer?",
      answer:
        "School automation: attendance, grades, scheduling, communication, and custom integrations.",
    },
    {
      question: "How much does it cost?",
      answer:
        "Transparent pricing based on scope. Free tier available, paid plans for advanced features.",
    },
    {
      question: "How long to get started?",
      answer:
        "Basic setup in days. Full implementation in 2-4 weeks depending on customization needs.",
    },
    {
      question: "Do you provide support?",
      answer:
        "Yes. Documentation, onboarding workshops, and premium support packages available.",
    },
    {
      question: "Still have questions?",
      answer: "",
      list: ["Documentation", "Talk to us"],
      links: [
        { text: "Documentation", href: "/docs" },
        { text: "Talk to us", href: "mailto:hello@databayt.org" },
      ],
    },
  ]

  const items = faqsDict.items?.length > 0 ? faqsDict.items : defaultItems

  return (
    <section className="py-16 md:py-32" dir={isRTL ? "rtl" : "ltr"}>
      <div className="grid gap-y-12 lg:grid-cols-[1fr_2fr] lg:gap-x-12">
        <div className="text-center lg:text-start">
          <h1 className="font-heading mb-4 text-4xl font-extrabold whitespace-pre-line md:text-5xl">
            <span className="md:hidden">{faqsDict.title}</span>
            <span className="hidden md:inline">
              {faqsDict.titleBreak || faqsDict.title}
            </span>
          </h1>
          <p className="muted">{faqsDict.subtitle}</p>
        </div>
        <div className="sm:mx-auto sm:max-w-xl lg:mx-0 lg:ms-auto">
          <Accordion type="single" collapsible defaultValue="item-0">
            {items.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-start">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-start">
                  {item.answer && <p className="muted mb-4">{item.answer}</p>}
                  {item.list && (
                    <ul className="list-outside list-disc space-y-2 ps-4">
                      {item.links
                        ? item.links.map((link, linkIndex) => (
                            <li key={linkIndex} className="muted">
                              <Link
                                href={link.href}
                                target={
                                  link.href.startsWith("http")
                                    ? "_blank"
                                    : undefined
                                }
                                rel={
                                  link.href.startsWith("http")
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                                className="hover:underline"
                              >
                                {link.text}
                              </Link>
                            </li>
                          ))
                        : item.list.map((listItem, listIndex) => (
                            <li key={listIndex} className="muted">
                              {listItem}
                            </li>
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
