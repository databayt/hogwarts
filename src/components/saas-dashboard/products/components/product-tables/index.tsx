// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Tables temporarily disabled – define minimal props to satisfy callers
export type Product = {
  id: string
  name: string
  category: string
  price: number
  description?: string
  image?: string
}

export function ProductTable({
  data,
  totalItems,
  columns,
}: {
  data: Product[]
  totalItems: number
  columns: readonly unknown[]
}) {
  void data
  void totalItems
  void columns
  return null
}
