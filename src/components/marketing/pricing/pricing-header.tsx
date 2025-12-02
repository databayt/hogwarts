import { Badge } from "@/components/ui/badge"

export default function PricingHeader() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-4 text-center">
      <div className="flex justify-center">
        <Badge className="bg-muted text-foreground">ROI Guaranteed</Badge>
      </div>
      <h1 className="text-4xl md:text-5xl font-heading font-extrabold">
        Simple. Transparent.
      </h1>
      <p className="muted max-w-[85%] mx-auto">
        All components and building blocks are open source — we charge for crafting fully functional masterpieces and ensuring their ongoing reliability.
      </p>
    </div>
  )
} 