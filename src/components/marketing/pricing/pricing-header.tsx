import { Badge } from "@/components/ui/badge"

export default function PricingHeader() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-4 text-center">
      <div className="flex justify-center">
        <Badge className="bg-muted text-foreground">ROI Guaranteed</Badge>
      </div>
      <h2 className="font-heading font-extrabold text-3xl sm:text-3xl md:text-6xl">
        Simple. Transparent.
      </h2>
      <p className="max-w-[85%] mx-auto leading-normal text-muted-foreground sm:text-lg sm:leading-7">
        All components and building blocks are open source — we charge for crafting fully functional masterpieces and ensuring their ongoing reliability.
      </p>
    </div>
  )
} 