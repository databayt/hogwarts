import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const pricingPlans = [
  {
    title: "One Project",
    description: "Perfect for businesses looking to automate a particular process or solve a focused challenge. We'll deliver a tailored solution built with precision — one project, one powerful outcome.",
    price: "$40",
    billing: "starting from",
    buttonText: "Custom Quote"
  },
  {
    title: "Strategic Partner", 
    description: "Ideal for businesses to outsource development, tap into specialized talent, or co-build long-term solutions. We become your tech partner — agile, reliable, and aligned with your vision.",
    price: "$10",
    billing: "per hours",
    buttonText: "Schedule Meet"
  },
  {
    title: "Product Access",
    description: "Access a growing library of deployable tools designed to solve common business problems — from workflow automation to intelligent integrations. Configure, connect, and go.",
    price: "$19", 
    billing: "Billed Monthly",
    buttonText: "Purchase Plan"
  }
]

export default function PricingPlans() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full pt-8 px-2">
        {pricingPlans.map((plan, index) => (
          <div key={index} className="flex flex-col w-full items-center justify-between gap-10 rounded-lg border p-10 text-center">
            <div className="grid gap-6">
              <h3 className="text-lg font-bold sm:text-xl">
                {plan.title}
              </h3>
              <p className="font-light">
                {plan.description}
              </p>
            </div>
            <div className="flex flex-col gap-4 text-center">
              <div>
                <h4 className="text-7xl font-bold">{plan.price}</h4>
                <p className="text-sm font-medium text-muted-foreground">
                  {plan.billing}
                </p>
              </div>
              <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "bg-muted text-foreground hover:bg-muted/80")}>
                {plan.buttonText}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-[62rem] flex-col gap-6 text-center pt-16">
        <p className="text-lg leading-relaxed text-muted-foreground">
          Not sure about these plans? Try us for your first project. You will want us for your next. And if you don&apos;t like working with us, we will even refund the money... or something... I don&apos;t know, we&apos;ve never been there before.
        </p>
        <div className="flex justify-center">
          <Link href="/docs/community/support" className={cn(buttonVariants({ size: "lg" }), "")}>
            Contact Us
          </Link>
        </div>
      </div>
    </>
  )
} 