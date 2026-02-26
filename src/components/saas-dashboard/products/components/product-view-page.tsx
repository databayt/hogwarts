// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import ProductForm from "./product-form"

type TProductViewPageProps = {
  productId: string
}

export default async function ProductViewPage({
  productId,
}: TProductViewPageProps) {
  // Tables and product data are disabled for now; render an empty form or basic create/edit title
  const pageTitle = productId === "new" ? "Create New Product" : "Edit Product"
  return <ProductForm initialData={null} pageTitle={pageTitle} />
}
