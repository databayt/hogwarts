// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Wallet } from "lucide-react"

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { FamilyBalanceHero } from "./balance-hero"
import { FamilyDueList } from "./due-list"
import { FamilyFeeCards } from "./fee-cards"
import { FamilyPayOptions } from "./pay-options"
import { getFamilyMoney } from "./queries"
import { FamilyReceipts } from "./receipts"
import type { FamilyDictionary, FamilyMoney } from "./types"

interface Props {
  dictionary: Dictionary
  lang: Locale
  /** Resolved by the caller when it already needed the data (e.g. for a banner). */
  money?: FamilyMoney | null
}

/**
 * `/finance` for a student or a guardian.
 *
 * The staff hub at this URL aggregates school-wide revenue, payroll and
 * expenses behind the reports permission — a family has none of it, and until
 * now got "access denied" on the one page named after their own money. This is
 * what that URL means to them instead: what is owed, what is owed next, how to
 * pay it, and what has already been paid.
 *
 * Composed the way the /live landing is: one server section per idea, each
 * hiding itself when it has no rows, no client code except the pay dialog.
 * Built phone-first — a single column that widens at `sm` and `lg` — because
 * this is the surface a parent opens on a phone when a reminder arrives, and
 * unlike the dashboard's phone sections there is no desktop twin to fall back
 * on.
 */
export default async function FamilyFinanceContent({
  dictionary,
  lang,
  money: provided,
}: Props) {
  const money = provided !== undefined ? provided : await getFamilyMoney(lang)
  if (!money) return null

  const finance = dictionary?.finance as Record<string, unknown> | undefined
  const fees = finance?.fees as Record<string, unknown> | undefined
  const d = (finance?.family ?? {}) as FamilyDictionary
  const gatewayDictionary = fees?.gateways as Record<string, unknown> | undefined
  const manualRailDictionary = fees?.manualRail as
    | Record<string, unknown>
    | undefined

  return (
    <div className="space-y-8">
      <FamilyBalanceHero
        money={money}
        lang={lang}
        d={d}
        gatewayDictionary={gatewayDictionary}
        manualRailDictionary={manualRailDictionary}
      />

      {money.fees.length === 0 ? (
        <EmptyBilling d={d} />
      ) : (
        <>
          <FamilyDueList
            money={money}
            lang={lang}
            d={d}
            gatewayDictionary={gatewayDictionary}
            manualRailDictionary={manualRailDictionary}
          />
          <FamilyFeeCards money={money} lang={lang} d={d} />
          <FamilyPayOptions money={money} lang={lang} d={d} />
          <FamilyReceipts money={money} lang={lang} d={d} />
        </>
      )}
    </div>
  )
}

/**
 * A family the school has not billed yet.
 *
 * Distinct from a family that has paid everything, which the hero already
 * congratulates: this one has no fees at all, and the honest thing to say is
 * that none have been issued — not that the balance is zero, which reads as a
 * settled account and is how a parent concludes there is nothing to pay when
 * the invoices simply have not been written.
 */
function EmptyBilling({ d }: { d?: FamilyDictionary }) {
  return (
    <section className="text-muted-foreground flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center">
      <Wallet className="h-8 w-8" />
      <p className="text-foreground font-medium">
        {d?.nothingBilled || "No fees have been issued yet"}
      </p>
      <p className="max-w-sm text-sm">
        {d?.nothingBilledBody ||
          "When the school issues your fees, they will appear here with their due dates."}
      </p>
    </section>
  )
}
