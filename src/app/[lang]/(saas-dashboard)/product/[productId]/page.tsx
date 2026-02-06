import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ProductDetailContent } from "@/components/saas-dashboard/product/detail"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Product Detail",
  description: "Product details and configuration",
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
      <ProductDetailContent
        dictionary={dictionary}
        lang={lang}
        productId={productId}
      />
    </div>
  )
}
