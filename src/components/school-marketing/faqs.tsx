"use client"

import { useDictionary } from "@/components/internationalization/use-dictionary"

export default function FAQs() {
  const { dictionary } = useDictionary()

  const faqs = dictionary?.marketing?.site?.faqs

  return (
    <section className="py-16 md:py-32">
      <div className="grid gap-y-12 lg:[grid-template-columns:1fr_auto]">
        <div className="text-center lg:text-start">
          <h2 className="font-heading mb-4 text-4xl font-extrabold md:text-5xl">
            {faqs?.title || "Frequently Asked Questions"}
          </h2>
          <p>{faqs?.subtitle || "Your guide to joining Hogwarts."}</p>
        </div>

        <div className="divide-y divide-dashed sm:mx-auto sm:max-w-lg lg:mx-0">
          {faqs?.questions?.map((faq, index) => {
            const hasListItems = faq.listItems && faq.listItems.length > 0
            // First FAQ uses ordered list, third FAQ uses unordered list
            const ListComponent = index === 0 ? "ol" : "ul"
            const listClass =
              index === 0
                ? "list-outside list-decimal space-y-2 ps-4"
                : "list-outside list-disc space-y-2 ps-4"

            return (
              <div key={index} className={index === 0 ? "pb-6" : "py-6"}>
                <h3 className="font-medium">{faq.question}</h3>
                <p
                  className={
                    hasListItems
                      ? "text-muted-foreground mt-4"
                      : "text-muted-foreground mt-4"
                  }
                >
                  {faq.answer}
                </p>

                {hasListItems && (
                  <ListComponent className={listClass}>
                    {faq.listItems.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="text-muted-foreground mt-4"
                      >
                        {item}
                      </li>
                    ))}
                  </ListComponent>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
