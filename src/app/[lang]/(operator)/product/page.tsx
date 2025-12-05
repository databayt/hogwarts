import { ProductContent } from '@/components/operator/product/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter';
import { PageNav, type PageNavItem } from '@/components/atom/page-nav';

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
  const d = dictionary?.operator;

  // Define product page navigation
  const productPages: PageNavItem[] = [
    { name: 'All Products', href: `/${lang}/product` },
  ];

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Products" />
      <PageNav pages={productPages} />
      <ProductContent dictionary={dictionary} lang={lang} />
    </div>
  );
}
