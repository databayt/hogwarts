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
    titleBreak: "Frequently\nAsked\nQuestions",
    subtitle: "Everything you need to know about our platform and services.",
    openSourceTitle: "Is the educational platform really open source?",
    openSourceDesc: "Yes! Every component and building block is open source. We charge for crafting fully functional educational solutions and ensuring their ongoing reliability.",
    openSourceItems: [
      "All educational components and templates are freely available",
      "Contributors earn a share of the value they help create",
      "Full transparency in development and educational processes",
      "Community-driven innovation in education technology"
    ],
    items: []
  }

  const defaultItems = [
    {
      question: "What services do you offer?",
      answer: "We automate repetitive business processes, streamline workflows, and build custom solutions that save you time and reduce manual work.",
      list: [
        "Data processing and analysis automation",
        "Workflow optimization and task automation",
        "Custom enterprise applications and integrations"
      ]
    },
    {
      question: "How much do you charge?",
      answer: "Our pricing is transparent and based on the complexity and scope of your project. We offer competitive rates and flexible payment terms."
    },
    {
      question: "How long does it take to complete a project?",
      answer: "Project timelines vary based on complexity. Simple automations can be completed in days, while complex enterprise solutions may take weeks or months."
    },
    {
      question: "Do you provide ongoing support?",
      answer: "Yes, we offer comprehensive support and maintenance packages to ensure your solutions continue to work optimally."
    },
    {
      question: "Can you work with my existing systems?",
      answer: "Absolutely! We specialize in integrating with existing systems and can work with your current infrastructure."
    },
    {
      question: "I'm busy with other commitments. Can I still contribute?",
      answer: "Perfect! Most contributors work part-time:",
      list: [
        "No minimum time commitment required",
        "Contribute when your schedule allows",
        "Start with small tasks and grow your involvement",
        "Earn proportional to your contribution level"
      ]
    },
    {
      question: "How do I start contributing?",
      answer: "",
      list: [
        "Explore the codebase at our GitHub repository",
        "Join our community discussions to introduce yourself",
        "Pick a first issue - we have 'good first issue' labels for newcomers",
        "Submit a pull request - start small and build up",
        "Earn your first revenue share as your contributions are used"
      ]
    },
    {
      question: "How do I get started?",
      answer: "Contact us for a consultation where we'll discuss your specific needs, challenges, and goals. We'll recommend the best approach and provide a detailed proposal."
    },
    {
      question: "Can I use Hogwarts components in my own projects?",
      answer: "Yes! All components are open source and can be used in your projects according to their respective licenses. We encourage reuse and building upon our work."
    },
    {
      question: "Can I include Hogwarts projects in my portfolio?",
      answer: "Absolutely! Working with us provides multiple portfolio benefits:",
      list: [
        "Add real-world enterprise projects to your portfolio",
        "Showcase your contributions to open-source",
        "Demonstrate experience with modern tech stack",
        "Build a public contribution history on GitHub"
      ]
    },
    {
      question: "How does the earning model work for real-world projects?",
      answer: "Our earning model has multiple streams:",
      list: [
        "Revenue share from components used in client projects",
        "Direct earnings from client project implementations",
        "Ongoing maintenance and support revenue",
        "Bonus rewards for high-impact contributions",
        "Ownership stake in projects you help build"
      ]
    },
    {
      question: "Still have questions?",
      answer: "",
      list: [
        "Join our community discussions on GitHub",
        "Join our Discord community",
        "Contact us for a free consultation",
        "Check our documentation",
        "Email us at hello@hogwarts.edu"
      ],
      links: [
        {
          text: "Join our community discussions on GitHub",
          href: "https://github.com/hogwarts/discussions"
        },
        {
          text: "Join our Discord community",
          href: "https://discord.gg/hogwarts"
        },
        {
          text: "Check our documentation at hogwarts.edu/docs",
          href: "/docs"
        },
        {
          text: "Email us at hello@hogwarts.edu",
          href: "mailto:hello@hogwarts.edu"
        }
      ]
    }
  ]

  const items = faqsDict.items?.length > 0 ? faqsDict.items : defaultItems

  return (
    <section className="scroll-py-16 py-16 md:scroll-py-32 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid gap-y-12 lg:grid-cols-[1fr_2fr] lg:gap-x-12">
          <div className="text-center lg:text-start">
            <h2 className="mb-4 whitespace-pre-line">
              {faqsDict.titleBreak || faqsDict.title}
            </h2>
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
      </div>
    </section>
  )
}