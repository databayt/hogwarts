// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ProductDetailContent } from "@/components/saas-dashboard/product/detail"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: [b?.products, b?.details].every(Boolean)
      ? [b?.products, b?.details].join(" - ")
      : "Product Detail",
    description: "Product details and configuration",
  }
}

interface Props {
  params: Promise<{ lang: Locale; productId: string }>
}

export default async function ProductDetail({ params }: Props) {
  const { lang, productId } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  const n = d?.nav
  const productPages: PageNavItem[] = [
    { name: n?.allProducts || "All Products", href: `/${lang}/product` },
    { name: n?.detail || "Detail", href: `/${lang}/product/${productId}` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={n?.detail || "Product Detail"} />
      <PageNav pages={productPages} />
      <ProductDetailContent lang={lang} productId={productId} />
    </div>
  )
}
