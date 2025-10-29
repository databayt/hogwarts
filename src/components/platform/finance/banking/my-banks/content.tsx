import { Suspense } from 'react';
import type { Locale } from '@/components/internationalization/config';
import type { getDictionary } from '@/components/internationalization/dictionaries';
import { getAccounts } from './actions';
import BankList from './bank-list';
import AddBankButton from './add-bank-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import type { User } from 'next-auth';
import PageHeader from '@/components/atom/page-header';

interface Props {
  user: User;
  dictionary: Awaited<ReturnType<typeof getDictionary>>['banking'];
  lang: Locale;
}

export default async function MyBanksContent(props: Props) {
  // Fetch user's bank accounts
  if (!props.user.id) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">User ID not found</p>
      </div>
    );
  }

  const accounts = await getAccounts({ userId: props.user.id });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title={props.dictionary.myBanks}
          className="text-start max-w-none"
        />
        {accounts.length > 0 && (
          <Suspense fallback={<div className="h-10 w-32 bg-muted animate-pulse rounded" />}>
            <AddBankButton dictionary={props.dictionary} />
          </Suspense>
        )}
      </div>

      {/* Banks List or Empty State */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {props.dictionary.noBanks}
            </h2>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              {props.dictionary.connectYourBank}
            </p>
            <Suspense fallback={<div className="h-10 w-40 bg-muted animate-pulse rounded" />}>
              <AddBankButton dictionary={props.dictionary} size="lg" />
            </Suspense>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {props.dictionary.accounts}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accounts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {props.dictionary.connectBank}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {props.dictionary.totalBalance}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {props.dictionary.lastSynced}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTimeAgo(
                    accounts[0]?.lastUpdated || new Date()
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bank Accounts List */}
          <BankList
            accounts={accounts}
            dictionary={props.dictionary}
            lang={props.lang}
          />
        </>
      )}
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

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}