'use client';

import { memo, useCallback, useMemo, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { BankAccount } from '../types';
import type { getDictionary } from '@/components/local/dictionaries';

interface Props {
  accounts: BankAccount[];
  selectedAccountId: string;
  dictionary: Awaited<ReturnType<typeof getDictionary>>['banking'];
}

function AccountTabs(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Memoize the tab change handler
  const handleTabChange = useCallback((accountId: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('id', accountId);
      router.push(`?${params.toString()}`);
    });
  }, [router, searchParams]);

  // Memoize the formatted balances
  const formattedAccounts = useMemo(() =>
    props.accounts.map(account => ({
      ...account,
      formattedBalance: formatCurrency(account.currentBalance),
      formattedAvailable: formatCurrency(account.availableBalance || account.currentBalance),
    })),
    [props.accounts]
  );

  // Memoize the selected account
  const selectedAccount = useMemo(() =>
    formattedAccounts.find(acc => acc.id === props.selectedAccountId) || formattedAccounts[0],
    [formattedAccounts, props.selectedAccountId]
  );

  return (
    <Tabs
      value={props.selectedAccountId}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="grid w-full" style={{
        gridTemplateColumns: `repeat(${Math.min(props.accounts.length, 4)}, minmax(0, 1fr))`
      }}>
        {formattedAccounts.map((account) => (
          <TabsTrigger
            key={account.id}
            value={account.id}
            className="relative"
            disabled={isPending}
          >
            <span className="truncate">{account.name}</span>
            {isPending && props.selectedAccountId === account.id && (
              <Loader2 className="ml-2 h-3 w-3 animate-spin" />
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={props.selectedAccountId} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedAccount?.name}</span>
              {selectedAccount?.bank && (
                <span className="text-sm font-normal text-muted-foreground">
                  {selectedAccount.bank.name}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {props.dictionary.accountType}: {selectedAccount?.type || 'Checking'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {props.dictionary.currentBalance}
                </p>
                <p className="text-2xl font-bold">
                  {selectedAccount?.formattedBalance}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {props.dictionary.availableBalance}
                </p>
                <p className="text-2xl font-bold">
                  {selectedAccount?.formattedAvailable}
                </p>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {props.dictionary.accountNumber}
                </span>
                <span className="text-sm font-medium">
                  ****{selectedAccount?.mask || '0000'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {props.dictionary.routingNumber}
                </span>
                <span className="text-sm font-medium">
                  {selectedAccount?.routingNumber || '****'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Utility function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Export memoized component
export default memo(AccountTabs);