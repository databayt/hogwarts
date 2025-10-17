import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  RefreshCw,
  Trash2,
  CreditCard,
  DollarSign,
  Calendar,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BankAccount } from '../types';
import type { getDictionary } from '@/components/local/dictionaries';
import type { Locale } from '@/components/local/config';
import { cn } from '@/lib/utils';
import BankActions from './bank-actions';

interface Props {
  accounts: BankAccount[];
  dictionary: Awaited<ReturnType<typeof getDictionary>>['banking'];
  lang: Locale;
}

export default function BankList(props: Props) {
  // Group accounts by bank
  const accountsByBank = props.accounts.reduce((groups, account) => {
    const bankName = account.bank?.name || 'Unknown Bank';
    if (!groups[bankName]) {
      groups[bankName] = [];
    }
    groups[bankName].push(account);
    return groups;
  }, {} as Record<string, BankAccount[]>);

  return (
    <div className="space-y-6">
      {Object.entries(accountsByBank).map(([bankName, bankAccounts]) => (
        <Card key={bankName}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{bankName}</CardTitle>
                <CardDescription>
                  {bankAccounts.length} {props.dictionary.accounts}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {props.dictionary.connected}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {bankAccounts.map((account) => (
              <BankAccountRow
                key={account.id}
                account={account}
                dictionary={props.dictionary}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BankAccountRow({
  account,
  dictionary,
}: {
  account: BankAccount;
  dictionary: any;
}) {
  const accountTypeColors = {
    checking: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    savings: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    credit: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    loan: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  };

  const typeColor = accountTypeColors[account.type as keyof typeof accountTypeColors] || accountTypeColors.checking;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{account.name}</p>
            <Badge variant="secondary" className={cn('text-xs', typeColor)}>
              {account.type}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm text-muted-foreground">
              ****{account.mask || '0000'}
            </span>
            <span className="text-sm text-muted-foreground">
              {dictionary.lastSync}: {formatDate(account.lastSyncedAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{dictionary.currentBalance}</p>
          <p className="text-lg font-semibold">
            {formatCurrency(account.currentBalance)}
          </p>
        </div>

        {/* Client component for actions */}
        <BankActions
          accountId={account.id}
          accountName={account.name}
          dictionary={dictionary}
        />
      </div>
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

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'Never';
  const d = new Date(date);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - d.getTime()) / 3600000);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}