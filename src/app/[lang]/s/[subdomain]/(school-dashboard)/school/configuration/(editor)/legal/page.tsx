// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { CheckCircle2, Gavel, ShieldCheck } from "lucide-react"

import { Card } from "@/components/ui/card"

export const metadata = { title: "Configuration: Legal" }

export default function LegalPage() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Licensing & Registration",
      description:
        "Ensure your school has valid operating licenses and meets local education authority requirements.",
    },
    {
      icon: CheckCircle2,
      title: "Safety Compliance",
      description:
        "CCTV surveillance, emergency alarm systems, and transportation safety standards.",
    },
    {
      icon: Gavel,
      title: "Terms & Policies",
      description:
        "Terms of service, privacy policy, and fee structure documentation for parents and students.",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold">Legal & Compliance</h3>
        <p className="text-muted-foreground text-sm">
          Review your school&apos;s compliance status and ensure all legal
          requirements are met.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.title} className="flex items-start gap-4 p-4">
            <div className="bg-muted flex-shrink-0 rounded-full p-2">
              <item.icon className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <h5 className="text-sm font-medium">{item.title}</h5>
              <p className="text-muted-foreground mt-1 text-xs">
                {item.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
