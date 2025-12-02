"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface FAQsProps {
    dictionary?: Dictionary
}

export default function FAQs({ dictionary }: FAQsProps) {
  const faqsDict = dictionary?.marketing?.faqs || {
    title: "Frequently Asked Questions",
    titleBreak: "FAQ",
    subtitle: "Everything you need to know.",
    openSourceTitle: "Is this really open source?",
    openSourceDesc: "Yes! All components are open source. We charge for complete solutions and ongoing support.",
    openSourceItems: [
      "Free components and templates",
      "Contributors earn revenue share",
      "Transparent development process"
    ],
    items: []
  }

  const defaultItems = [
    {
      question: "What do you offer?",
      answer: "School automation: attendance, grades, scheduling, communication, and custom integrations."
    },
    {
      question: "How much does it cost?",
      answer: "Transparent pricing based on scope. Free tier available, paid plans for advanced features."
    },
    {
      question: "How long to get started?",
      answer: "Basic setup in days. Full implementation in 2-4 weeks depending on customization needs."
    },
    {
      question: "Do you provide support?",
      answer: "Yes. Documentation, community Discord, and premium support packages available."
    },
    {
      question: "Can I contribute?",
      answer: "Absolutely! Contribute code, earn revenue share. No minimum commitment required."
    },
    {
      question: "Still have questions?",
      answer: "",
      list: [
        "GitHub Discussions",
        "Discord Community",
        "Documentation"
      ],
      links: [
        { text: "GitHub Discussions", href: "https://github.com/databayt/hogwarts/discussions" },
        { text: "Discord Community", href: "https://discord.gg/uPa4gGG62c" },
        { text: "Documentation", href: "/docs" }
      ]
    }
  ]

  const items = faqsDict.items?.length > 0 ? faqsDict.items : defaultItems

  return (
    <section className="py-16 md:py-32">
      <div className="grid gap-y-12 lg:grid-cols-[1fr_2fr] lg:gap-x-12">
        <div className="text-center lg:text-start">
          <h1 className="mb-4 whitespace-pre-line text-5xl md:text-7xl font-heading font-extrabold">
            {faqsDict.titleBreak || faqsDict.title}
          </h1>
          <p className="muted">{faqsDict.subtitle}</p>
        </div>
        <div className="divide-y divide-dashed sm:mx-auto sm:max-w-xl lg:mx-0 lg:ms-auto">
          <div className="pb-6">
            <h3 className="text-start">{faqsDict.openSourceTitle}</h3>
            <p className="muted my-4 text-start">{faqsDict.openSourceDesc}</p>
            <ul className="list-outside list-disc space-y-2 ps-4">
              {faqsDict.openSourceItems?.map((item, index) => (
                <li key={index} className="muted">{item}</li>
              ))}
            </ul>
          </div>
          <div className="pt-6">
            <Accordion type="single" collapsible defaultValue="item-1">
              {items.map((item, index) => (
                <AccordionItem key={index} value={`item-${index + 1}`}>
                  <AccordionTrigger className="text-start">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-start">
                    {item.answer && (
                      <p className="muted mb-4">{item.answer}</p>
                    )}
                    {item.list && (
                      <ul className="list-outside list-disc space-y-2 ps-4">
                        {item.links ? (
                          item.links.map((link, linkIndex) => (
                            <li key={linkIndex} className="muted">
                              <Link
                                href={link.href}
                                target={link.href.startsWith('http') ? "_blank" : undefined}
                                rel={link.href.startsWith('http') ? "noopener noreferrer" : undefined}
                                className="hover:underline"
                              >
                                {link.text}
                              </Link>
                            </li>
                          ))
                        ) : (
                          item.list.map((listItem, listIndex) => (
                            <li key={listIndex} className="muted">{listItem}</li>
                          ))
                        )}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  )
}
