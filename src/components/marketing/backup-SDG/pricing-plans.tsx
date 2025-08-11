import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const pricingPlans = [
  {
    title: "Trial",
    description: "Full product trial with no card required. Ideal for testing with a small class and staff.",
    price: "$0",
    billing: "14 days",
    buttonText: "Start Free Trial"
  },
  {
    title: "Basic",
    description: "Everything to run a small to medium school. Manual payments supported (receipt upload).",
    price: "$19",
    billing: "per school / month",
    buttonText: "Get Started"
  },
  {
    title: "Pro",
    description: "Advanced reporting, custom domains, and priority support for growing schools.",
    price: "$49", 
    billing: "per school / month",
    buttonText: "Upgrade to Pro"
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
          Manual payments are supported for Sudan: upload a receipt and our operators will review and activate your plan. Online payments will be available later.
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