"use client";

import { Shell as PageContainer } from "@/components/table/shell";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
}

export function ProductContent(props: Props) {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <div>
            <h4>Products</h4>
            <p className='muted'>Manage products (Server side table functionalities.)</p>
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
        <div className='rounded-lg border bg-card p-6 muted'>
          Product table is temporarily disabled while we integrate tenant-scoped data.
        </div>
      </div>
    </PageContainer>
  );
}
