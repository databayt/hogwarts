"use client"

import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { EmptyState } from "@/components/saas-dashboard/common/empty-state"
import { Shell as PageContainer } from "@/components/table/shell"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
  productId: string
}

export function ProductDetailContent({ dictionary, lang, productId }: Props) {
  return (
    <PageContainer>
      <div className="flex-1 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Product Details</h1>
          <p className="text-muted-foreground text-sm">
            Product ID: {productId}
          </p>
        </div>
        <EmptyState
          title="Product Details Coming Soon"
          description="Product detail management features are under development."
        />
      </div>
    </PageContainer>
  )
}
