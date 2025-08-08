const faqs = [
  {
    question: "How does the free trial work?",
    answer: "The trial gives you full access for 14 days with no credit card. You can onboard staff and a small class to evaluate the system."
  },
  {
    question: "Do you support manual payments?",
    answer: "Yes. Upload a payment receipt in the dashboard; our operators review and activate your plan. This is optimized for Sudan."
  },
  {
    question: "Can I switch between Basic and Pro?",
    answer: "You can upgrade or downgrade anytime. Changes apply to your next billing period, and your data remains intact."
  },
  {
    question: "Do you offer enterprise solutions?",
    answer: "We provide custom deployments, SLAs, and dedicated support. Contact us for a tailored quote."
  }
]

export default function PricingFAQs() {
  return (
    <section className="scroll-py-16 py-16 md:scroll-py-32 md:py-32">
      <div className="flex w-full max-w-6xl">
        <div className="grid gap-y-12 gap-x-32 px-2 lg:[grid-template-columns:1fr_auto]">
          <div className="text-center lg:text-left">
            <h2 className="mb-4 text-3xl font-semibold md:text-4xl">
              Frequently <br className="hidden lg:block" /> Asked <br className="hidden lg:block" />
              Questions
            </h2>
            <p>Your guide to pricing and plans for the school cloud.</p>
          </div>

          <div className="divide-y divide-dashed sm:mx-auto sm:max-w-2xl lg:mx-0">
            {faqs.map((faq, index) => (
              <div key={index} className={index === 0 ? "pb-6" : "py-6"}>
                <h3 className="font-medium">{faq.question}</h3>
                <p className="text-muted-foreground mt-4">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 