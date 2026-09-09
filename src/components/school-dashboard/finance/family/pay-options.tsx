// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  Banknote,
  Building2,
  CreditCard,
  Smartphone,
  Wallet,
} from "lucide-react"

import { GATEWAY_DISPLAY } from "@/lib/payment/constants"
import type { PaymentGateway } from "@/lib/payment/types"
import { SectionHeading } from "@/components/school-dashboard/dashboard/section-heading"

import type { FamilySectionProps } from "./types"

const ICONS: Record<string, React.ElementType> = {
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
  Wallet,
}

/**
 * The ways this school actually takes money.
 *
 * Informational on purpose: paying is always started from an instalment, which
 * is what carries the fee the money is for. A grid of live "pay" buttons with
 * no fee attached would have to guess which one it meant. What this answers is
 * the question a family asks before it ever presses Pay — "can I use Bankak?"
 * — and it answers it from the school's own configuration, so a rail with no
 * published account never appears.
 *
 * `cash` and `bank_transfer` stay in the list even though the app cannot
 * process them: they are real ways to pay this school, recorded at the office.
 */
export function FamilyPayOptions({ money, lang, d }: FamilySectionProps) {
  if (money.methods.length === 0) return null

  return (
    <section>
      <SectionHeading title={d?.payWith || "Ways to pay"} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {money.methods.map((gateway: PaymentGateway) => {
          const display = GATEWAY_DISPLAY[gateway]
          if (!display) return null
          const Icon = ICONS[display.icon] ?? CreditCard

          return (
            <li
              key={gateway}
              className="bg-card flex items-center gap-4 rounded-2xl border p-4"
            >
              <span className="bg-primary/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                <Icon className="text-primary h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{display.label[lang]}</p>
                <p className="text-muted-foreground text-xs">
                  {display.description[lang]}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
