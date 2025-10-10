import { ProductContent } from '@/components/operator/product/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: 'Products',
  description: 'Product management and configuration'
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Product({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <ProductContent dictionary={dictionary} lang={lang} />;
}
