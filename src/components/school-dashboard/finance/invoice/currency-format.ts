// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export default function currencyFormat(
  amt: number,
  currency: string,
  locale: string = "ar"
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amt)
}
