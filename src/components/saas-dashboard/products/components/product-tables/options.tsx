// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/* eslint-disable @typescript-eslint/no-explicit-any */

export function getCategoryOptions(dictionary?: any) {
  const c = dictionary?.operator?.products?.categories
  return [
    { value: "Electronics", label: c?.electronics || "Electronics" },
    { value: "Furniture", label: c?.furniture || "Furniture" },
    { value: "Clothing", label: c?.clothing || "Clothing" },
    { value: "Toys", label: c?.toys || "Toys" },
    { value: "Groceries", label: c?.groceries || "Groceries" },
    { value: "Books", label: c?.books || "Books" },
    { value: "Jewelry", label: c?.jewelry || "Jewelry" },
    { value: "Beauty Products", label: c?.beautyProducts || "Beauty Products" },
  ]
}

/** @deprecated Use getCategoryOptions(dictionary) instead */
export const CATEGORY_OPTIONS = getCategoryOptions()
