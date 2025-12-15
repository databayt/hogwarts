import { Badge } from "@/components/ui/badge"

export default function PricingHeader() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-4 text-center">
      <div className="flex justify-center">
        <Badge className="bg-muted text-foreground">ROI Guaranteed</Badge>
      </div>
      <h1 className="font-heading text-4xl font-extrabold md:text-5xl">
        Simple. Transparent.
      </h1>
      <p className="muted mx-auto max-w-[85%]">
        All components and building blocks are open source — we charge for
        crafting fully functional masterpieces and ensuring their ongoing
        reliability.
      </p>
    </div>
  )
}
