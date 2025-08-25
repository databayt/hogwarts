import { ProductDetailContent } from '@/components/operator/product/detail';

export const metadata = {
  title: 'Product Detail',
  description: 'Product details and configuration'
};

type PageProps = { params: Promise<{ productId: string }> };

export default async function ProductDetail(props: PageProps) {
  const params = await props.params;
  return <ProductDetailContent productId={params.productId} />;
}
