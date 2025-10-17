'use client';

import { memo, useCallback, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { getDictionary } from '@/components/local/dictionaries';

interface Props {
  selectedCategory?: string;
  dictionary: Awaited<ReturnType<typeof getDictionary>>['banking'];
}

const categories = [
  { value: 'all', label: 'All' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'transport', label: 'Transport' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'bills', label: 'Bills' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' },
];

function TransactionFilters(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleCategoryChange = useCallback((category: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (category === 'all') {
        params.delete('category');
      } else {
        params.set('category', category);
      }
      router.push(`?${params.toString()}`);
    });
  }, [router, searchParams]);

  const currentCategory = props.selectedCategory || 'all';

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category.value}
          variant={currentCategory === category.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleCategoryChange(category.value)}
          disabled={isPending}
          className={cn(
            "transition-all",
            isPending && "opacity-50"
          )}
        >
          {category.label}
        </Button>
      ))}
    </div>
  );
}

export default memo(TransactionFilters);