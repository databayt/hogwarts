import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/lib/auth';
import type { BankAccount } from '../types';
import type { getDictionary } from '@/components/local/dictionaries';
import { cn } from '@/lib/utils';

interface Props {
  user: User;
  banks: BankAccount[];
  dictionary: Awaited<ReturnType<typeof getDictionary>>['banking'];
}

export default function BankingDashboardSidebar(props: Props) {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* User Profile Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{props.dictionary.myProfile}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium">{props.user.name}</p>
            <p className="text-xs text-muted-foreground">{props.user.email}</p>
          </div>
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{props.dictionary.memberSince}</span>
              <span>{formatDate(props.user.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-muted-foreground">{props.dictionary.accountStatus}</span>
              <Badge variant="success" className="text-xs">
                {props.dictionary.verified}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Banks */}
      <Card className="flex-1">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{props.dictionary.myBanks}</CardTitle>
            <Link href="/banking/my-banks">
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {props.banks.length === 0 ? (
            <div className="text-center py-6">
              <Building2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                {props.dictionary.noBanksConnected}
              </p>
              <Link href="/banking/my-banks" className="mt-4 inline-block">
                <Button size="sm" variant="outline">
                  {props.dictionary.connectBank}
                </Button>
              </Link>
            </div>
          ) : (
            props.banks.map((bank) => (
              <BankCard key={bank.id} bank={bank} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{props.dictionary.quickActions}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/banking/payment-transfer" className="block">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <CreditCard className="mr-2 h-4 w-4" />
              {props.dictionary.makeTransfer}
            </Button>
          </Link>
          <Link href="/banking/transaction-history" className="block">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Building2 className="mr-2 h-4 w-4" />
              {props.dictionary.viewTransactions}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function BankCard({ bank }: { bank: BankAccount }) {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
  ];

  const colorIndex = bank.id.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white", bgColor)}>
          {bank.bank?.name?.charAt(0) || 'B'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {bank.name}
          </p>
          <p className="text-xs text-muted-foreground">
            ****{bank.mask || '0000'}
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Balance</span>
          <span className="text-sm font-semibold">
            {formatCurrency(bank.currentBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Utility functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}