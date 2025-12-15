import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ProductDetailContent } from "@/components/operator/product/detail"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

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

  // Define product page navigation
  const productPages: PageNavItem[] = [
    { name: "All Products", href: `/${lang}/product` },
    { name: "Detail", href: `/${lang}/product/${productId}` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Product Detail" />
      <PageNav pages={productPages} />
      <ProductDetailContent
        dictionary={dictionary}
        lang={lang}
        productId={productId}
      />
    </div>
  )
}
