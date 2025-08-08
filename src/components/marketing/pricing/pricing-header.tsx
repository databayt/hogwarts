import { Badge } from "@/components/ui/badge"

export default function PricingHeader() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-4 text-center">
      <div className="flex justify-center">
        <Badge className="bg-muted text-foreground">Sudan‑friendly • Manual payments supported</Badge>
      </div>
      <h2 className="font-heading font-extrabold text-3xl sm:text-3xl md:text-6xl">Pricing for Schools</h2>
      <p className="max-w-[85%] mx-auto leading-normal text-muted-foreground sm:text-lg sm:leading-7">
        Multi‑tenant school cloud for Sudan. Start with a free trial. Upgrade when ready. All plans include Arabic/English, RTL, attendance, announcements, and dashboards.
      </p>
    </div>
  )
} 