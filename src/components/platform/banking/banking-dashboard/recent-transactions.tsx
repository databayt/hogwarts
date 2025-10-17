import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import type { Transaction } from '../types';
import type { getDictionary } from '@/components/local/dictionaries';
import type { Locale } from '@/components/local/config';
import { cn } from '@/lib/utils';
import TransactionFilters from './transaction-filters';
import { Suspense } from 'react';

interface Props {
  transactions: Transaction[];
  selectedCategory?: string;
  dictionary: Awaited<ReturnType<typeof getDictionary>>['banking'];
  lang: Locale;
}

export default function RecentTransactionsList(props: Props) {
  // Filter transactions if category is selected
  const filteredTransactions = props.selectedCategory
    ? props.transactions.filter(t => t.category === props.selectedCategory)
    : props.transactions;

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{props.dictionary.recentTransactions}</CardTitle>
            <CardDescription>
              {props.dictionary.transactionsDescription}
            </CardDescription>
          </div>
          <Link href={`/${props.lang}/banking/transaction-history`}>
            <Button variant="outline" size="sm">
              {props.dictionary.viewAll}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Client component for filter interactions */}
        <Suspense fallback={<FiltersSkeleton />}>
          <TransactionFilters
            selectedCategory={props.selectedCategory}
            dictionary={props.dictionary}
          />
        </Suspense>

        {/* Transaction list */}
        <div className="mt-6 space-y-6">
          {Object.entries(groupedTransactions).length === 0 ? (
            <EmptyState dictionary={props.dictionary} />
          ) : (
            Object.entries(groupedTransactions).map(([date, transactions]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {formatDate(date)}
                </h3>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      dictionary={props.dictionary}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionRow({
  transaction,
  dictionary,
}: {
  transaction: Transaction;
  dictionary: any;
}) {
  const isIncome = transaction.amount > 0;
  const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-full",
          isIncome ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">
            {transaction.name}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {transaction.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {transaction.account?.bank?.name}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-sm font-semibold",
          isIncome ? "text-green-600 dark:text-green-400" : "text-foreground"
        )}>
          {isIncome ? '+' : '-'}
          {formatCurrency(Math.abs(transaction.amount))}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ dictionary }: { dictionary: any }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">
        {dictionary.noTransactions}
      </p>
    </div>
  );
}

function FiltersSkeleton() {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}

// Utility functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }
}