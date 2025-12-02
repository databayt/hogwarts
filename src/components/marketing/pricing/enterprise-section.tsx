import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Locale } from "@/components/internationalization/config"

interface EnterpriseSectionProps {
  lang?: Locale
}

export default function EnterpriseSection({ lang }: EnterpriseSectionProps) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 text-center pt-16">
      <div className="flex justify-center">
        <Badge className="bg-muted text-foreground">Enterprise</Badge>
      </div>
      <h1 className="text-4xl md:text-5xl font-heading font-extrabold">
        Need Something Bigger?
      </h1>
      <p className="muted">
        For enterprises and large organizations, we offer custom solutions with dedicated teams, SLAs, and specialized support tailored to your unique requirements.
      </p>
      <div className="flex justify-center">
        <Link href={`/${lang}/docs/community/support`} className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
          Talk to Sales
        </Link>
      </div>
    </div>
  )
} 