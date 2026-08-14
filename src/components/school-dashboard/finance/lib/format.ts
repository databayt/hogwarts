// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Thin barrel so finance components import money + date formatters from one path.
// Convention: finance money (Payment.amount, the ledger's Decimal(12,2) columns,
// fee/invoice amounts) is stored in WHOLE currency units. Use `formatMoney` for
// those. `formatCurrency` (re-exported below) divides by 100 and is ONLY for the
// rare value genuinely stored as integer cents — never use it on whole-unit
// aggregates (it renders 1/100 of the real figure).

export { formatCurrency, toCents, fromCents } from "./accounting/utils"
export { formatDate, getDateLocale } from "@/lib/format-date"

// The pure formatters live in `format-money.ts` so client components can import
// them without dragging `./accounting/utils` -> `@/lib/db` into the browser.
export { formatMoney, formatCompactMoney, formatNumber } from "./format-money"
