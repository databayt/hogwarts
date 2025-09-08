import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function EnterpriseSection() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 text-center pt-16">
      <div className="flex justify-center">
        <Badge className="bg-muted text-foreground">Enterprise</Badge>
      </div>
      <h3 className="font-heading">
        Need Something Bigger?
      </h3>
      <p className="leading-normal text-muted-foreground sm:leading-7">
        For enterprises and large organizations, we offer custom solutions with dedicated teams, SLAs, and specialized support tailored to your unique requirements.
      </p>
      <div className="flex justify-center">
        <Link href="/docs/community/support" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
          Talk to Sales
        </Link>
      </div>
    </div>
  )
} 