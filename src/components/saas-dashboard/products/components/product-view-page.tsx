// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/* eslint-disable @typescript-eslint/no-explicit-any */

import ProductForm from "./product-form"

type TProductViewPageProps = {
  productId: string
  dictionary?: any
}

export default async function ProductViewPage({
  productId,
  dictionary,
}: TProductViewPageProps) {
  const p = dictionary?.operator?.products
  // Tables and product data are disabled for now; render an empty form or basic create/edit title
  const pageTitle =
    productId === "new"
      ? p?.createNew || "Create New Product"
      : p?.edit || "Edit Product"
  return (
    <ProductForm
      initialData={null}
      pageTitle={pageTitle}
      dictionary={dictionary}
    />
  )
}
