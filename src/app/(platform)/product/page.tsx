import { Shell as PageContainer } from '@/components/table/shell';
import { buttonVariants } from '@/components/ui/button';
// import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
// import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
// import ProductListingPage from '@/features/products/components/product-listing';
// import { searchParamsCache, serialize } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Products'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page() {
  // const searchParams = await props.searchParams;
  // Allow nested RSCs to access the search params (in a type-safe way)
  // searchParamsCache.parse(searchParams);

  // This key is used for invoke suspense if any of the search params changed (used for filters).
  // const key = serialize({ ...searchParams });

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-xl font-semibold'>Products</h1>
            <p className='text-sm text-muted-foreground'>Manage products (Server side table functionalities.)</p>
          </div>
          <Link
            href='/dashboard/product/new'
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <IconPlus className='mr-2 h-4 w-4' /> Add New
          </Link>
        </div>
        <Separator />
        {/* Tables temporarily disabled */}
        <div className='rounded-lg border bg-card p-6 text-sm text-muted-foreground'>
          Product table is temporarily disabled while we integrate tenant-scoped data.
        </div>
      </div>
    </PageContainer>
  );
}
