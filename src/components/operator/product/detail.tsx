"use client";

import { Shell as PageContainer } from "@/components/table/shell";
import { EmptyState } from "@/components/operator/common/empty-state";

interface Props {
  productId: string;
}

export function ProductDetailContent({ productId }: Props) {
  return (
    <PageContainer>
      <div className='flex-1 space-y-4'>
        <div>
          <h1 className='text-xl font-semibold'>Product Details</h1>
          <p className='text-sm text-muted-foreground'>Product ID: {productId}</p>
        </div>
        <EmptyState 
          title="Product Details Coming Soon" 
          description="Product detail management features are under development." 
        />
      </div>
    </PageContainer>
  );
}
