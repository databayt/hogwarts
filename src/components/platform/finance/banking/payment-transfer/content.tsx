import { Suspense } from 'react';
import type { Locale } from '@/components/internationalization/config';
import type { getDictionary } from '@/components/internationalization/dictionaries';
import { getAccounts } from './actions';
import PaymentTransferForm from './form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { User } from 'next-auth';

interface Props {
  user: User;
  dictionary: Awaited<ReturnType<typeof getDictionary>>['banking'];
  lang: Locale;
}

export default async function PaymentTransferContent(props: Props) {
  // Fetch user's bank accounts
  if (!props.user.id) {
    return (
      <div>
        <p className="text-muted-foreground">User ID not found</p>
      </div>
    );
  }

  const accounts = await getAccounts({ userId: props.user.id });

  // Check if user has enough accounts for transfer
  if (!accounts || accounts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {props.dictionary.noBanks}
          </h2>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            {props.dictionary.connectYourBank}
          </p>
          <Link href={`/${props.lang}/banking/my-banks`}>
            <Button>
              {props.dictionary.connectBank}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Calculate total available balance
  const totalAvailable = accounts.reduce(
    (sum, acc) => sum + (acc.availableBalance || acc.currentBalance),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {props.dictionary.paymentTransfer}
        </h1>
      </div>

      {/* Balance Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {props.dictionary.availableBalance}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAvailable)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {props.dictionary.accounts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Form */}
      <Card>
        <CardHeader>
          <CardTitle>{props.dictionary.transfer}</CardTitle>
          <CardDescription>
            {props.dictionary.sendMoney}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <PaymentTransferForm
              accounts={accounts}
              dictionary={props.dictionary}
              lang={props.lang}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
          <div className="h-10 w-full bg-muted animate-pulse rounded" />
        </div>
      ))}
      <div className="h-10 w-32 bg-muted animate-pulse rounded" />
    </div>
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