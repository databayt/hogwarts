import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import type { BankAccount } from '../types';
import type { getDictionary } from '@/components/local/dictionaries';
import { cn } from '@/lib/utils';

interface Props {
  accounts: BankAccount[];
  dictionary: Awaited<ReturnType<typeof getDictionary>>['banking'];
}

export default function BalanceCards(props: Props) {
  // Calculate totals
  const totalBalance = props.accounts.reduce(
    (sum, account) => sum + account.currentBalance,
    0
  );

  const totalAvailable = props.accounts.reduce(
    (sum, account) => sum + (account.availableBalance || account.currentBalance),
    0
  );

  // Calculate monthly income/expenses from recent transactions
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = props.accounts.flatMap(account =>
    account.transactions?.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
    }) || []
  );

  const monthlyIncome = monthlyTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const cards = [
    {
      title: props.dictionary.totalBalance,
      value: totalBalance,
      icon: DollarSign,
      trend: null,
      description: `${props.accounts.length} ${props.dictionary.connectedAccounts}`,
    },
    {
      title: props.dictionary.availableBalance,
      value: totalAvailable,
      icon: CreditCard,
      trend: null,
      description: props.dictionary.availableToSpend,
    },
    {
      title: props.dictionary.monthlyIncome,
      value: monthlyIncome,
      icon: TrendingUp,
      trend: 'up',
      description: props.dictionary.thisMonth,
      className: 'text-green-600 dark:text-green-400',
    },
    {
      title: props.dictionary.monthlyExpenses,
      value: monthlyExpenses,
      icon: TrendingDown,
      trend: 'down',
      description: props.dictionary.thisMonth,
      className: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={cn('h-4 w-4 text-muted-foreground', card.className)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(card.value)}
              </div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Utility function for formatting currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}