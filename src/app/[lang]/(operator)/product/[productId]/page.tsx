import { ProductDetailContent } from '@/components/operator/product/detail';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: 'Product Detail',
  description: 'Product details and configuration'
};

interface Props {
  params: Promise<{ lang: Locale; productId: string }>
}

export default async function ProductDetail({ params }: Props) {
  const { lang, productId } = await params;
  const dictionary = await getDictionary(lang);

  return <ProductDetailContent dictionary={dictionary} lang={lang} productId={productId} />;
}
