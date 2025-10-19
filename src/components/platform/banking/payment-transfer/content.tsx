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
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">User ID not found</p>
      </div>
    );
  }

  const accounts = await getAccounts({ userId: props.user.id });

  // Check if user has enough accounts for transfer
  if (!accounts || accounts.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {props.dictionary.noBanksForTransfer}
            </h2>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              {props.dictionary.connectBankFirst}
            </p>
            <Link href={`/${props.lang}/banking/my-banks`}>
              <Button>
                {props.dictionary.connectBank}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate total available balance
  const totalAvailable = accounts.reduce(
    (sum, acc) => sum + (acc.availableBalance || acc.currentBalance),
    0
  );

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {props.dictionary.paymentTransfer}
          </h1>
          <p className="text-muted-foreground mt-2">
            {props.dictionary.transferDescription}
          </p>
        </div>

        {/* Balance Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {props.dictionary.totalAvailable}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalAvailable)}
              </div>
              <p className="text-xs text-muted-foreground">
                {props.dictionary.acrossAllAccounts}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {props.dictionary.connectedAccounts}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts.length}</div>
              <p className="text-xs text-muted-foreground">
                {props.dictionary.availableForTransfer}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transfer Form */}
        <Card>
          <CardHeader>
            <CardTitle>{props.dictionary.newTransfer}</CardTitle>
            <CardDescription>
              {props.dictionary.fillFormToTransfer}
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

        {/* Security Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {props.dictionary.securityNotice}
          </AlertDescription>
        </Alert>
      </div>
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