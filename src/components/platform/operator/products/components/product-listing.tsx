type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
};
const fakeProducts = {
  async getProducts(_: Record<string, unknown>) {
    return {
      total_products: 0,
      products: [] as Product[],
    };
  },
};
import { searchParamsCache } from '@/components/platform/operator/lib/searchparams';
import { ProductTable } from './product-tables';
import { columns } from './product-tables/columns';

type ProductListingPage = Record<string, never>;

export default async function ProductListingPage({}: ProductListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const categories = searchParamsCache.get('category');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(categories && { categories: categories })
  };

  const data = await fakeProducts.getProducts(filters);
  const totalProducts = data.total_products;
  const products: Product[] = data.products;

  return (
    <ProductTable
      data={products}
      totalItems={totalProducts}
      columns={columns}
    />
  );
}
