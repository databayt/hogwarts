const faqs = [
  {
    question: "What's included in the One Project plan?",
    answer: "The One Project plan includes complete custom development for a single automation solution, including consultation, development, testing, and deployment."
  },
  {
    question: "How does the hourly billing work for Strategic Partner?",
    answer: "With Strategic Partner, you get access to our development team at $10/hour. Perfect for ongoing projects, maintenance, or when you need flexible development resources."
  },
  {
    question: "Can I switch between plans?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
  },
  {
    question: "Do you offer enterprise solutions?",
    answer: "Absolutely! For enterprise needs, we offer custom solutions with dedicated teams, SLAs, and specialized support. Contact us for a tailored quote."
  }
]

export default function PricingFAQs() {
  return (
    <section className="scroll-py-16 py-16 md:scroll-py-32 md:py-32">
      <div className="flex w-full max-w-6xl">
        <div className="grid gap-y-12 gap-x-32 px-2 lg:[grid-template-columns:1fr_auto]">
          <div className="text-center lg:text-left">
            <h2 className="mb-4">
              Frequently <br className="hidden lg:block" /> Asked <br className="hidden lg:block" />
              Questions
            </h2>
            <p>Your guide to pricing and plans with Databayt.</p>
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