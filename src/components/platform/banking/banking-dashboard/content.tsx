import { Suspense } from 'react';
import type { Locale } from '@/components/local/config';
import type { getDictionary } from '@/components/local/dictionaries';
import BankingDashboardHeader from './header';
import BalanceCards from './balance-cards';
import AccountTabs from './account-tabs';
import RecentTransactionsList from './recent-transactions';
import { getAccounts, getAccount, getRecentTransactions } from './actions';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardSkeleton from './skeleton';

interface Props {
  searchParams?: {
    id?: string;
    page?: string;
    category?: string;
  };
  dictionary: Awaited<ReturnType<typeof getDictionary>>['banking'];
  lang: Locale;
}

export default async function BankingDashboardContent(props: Props) {
  // Get current user (server-side)
  const user = await currentUser();

  if (!user) {
    redirect(`/${props.lang}/login`);
  }

  // Parallel data fetching for better performance
  const [accounts, recentTransactions] = await Promise.all([
    getAccounts({ userId: user.id }),
    getRecentTransactions({
      userId: user.id,
      limit: 10
    })
  ]);

  // Handle empty state
  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {props.dictionary.noAccountsTitle}
          </h2>
          <p className="text-muted-foreground mb-6">
            {props.dictionary.noAccountsDescription}
          </p>
          {/* Add bank button will be a client component */}
          <Suspense fallback={<div className="h-10 w-32 bg-muted animate-pulse rounded" />}>
            <AddBankButton dictionary={props.dictionary} />
          </Suspense>
        </div>
      </div>
    );
  }

  // Get selected account details
  const selectedAccountId = props.searchParams?.id || accounts[0]?.id;
  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId) || accounts[0];

  return (
    <div className="flex min-h-screen w-full">
      {/* Main Content Area */}
      <div className="flex-1 space-y-8 p-8">
        {/* Header Section - Server Component */}
        <BankingDashboardHeader
          user={user}
          dictionary={props.dictionary}
        />

        {/* Balance Overview - Server Component */}
        <BalanceCards
          accounts={accounts}
          dictionary={props.dictionary}
        />

        {/* Account Tabs - Client Component for interactivity */}
        <Suspense fallback={<AccountTabsSkeleton />}>
          <AccountTabs
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            dictionary={props.dictionary}
          />
        </Suspense>

        {/* Recent Transactions - Server Component with client filters */}
        <Suspense fallback={<TransactionsListSkeleton />}>
          <RecentTransactionsList
            transactions={recentTransactions}
            selectedCategory={props.searchParams?.category}
            dictionary={props.dictionary}
            lang={props.lang}
          />
        </Suspense>
      </div>

      {/* Right Sidebar - Server Component */}
      <aside className="hidden xl:flex xl:w-80 xl:flex-col xl:border-l">
        <Suspense fallback={<SidebarSkeleton />}>
          <BankingDashboardSidebar
            user={user}
            banks={accounts.slice(0, 2)}
            dictionary={props.dictionary}
          />
        </Suspense>
      </aside>
    </div>
  );
}

// Skeleton Components (These are simple, so can be in same file)
function AccountTabsSkeleton() {
  return (
    <div className="w-full">
      <div className="flex gap-2 border-b">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 w-32 bg-muted animate-pulse rounded-t" />
        ))}
      </div>
      <div className="h-64 bg-muted/30 animate-pulse rounded-b" />
    </div>
  );
}

function TransactionsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center justify-between p-4 border rounded">
          <div className="flex gap-4">
            <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="h-5 w-20 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        {[1, 2].map(i => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}

// Import client components
import AddBankButton from '../my-banks/add-bank-button';
import BankingDashboardSidebar from './sidebar';