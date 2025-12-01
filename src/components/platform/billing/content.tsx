import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantContext } from "@/lib/tenant-context";
import { BillingPage } from "./billing-page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconLoader2 } from "@tabler/icons-react";
import {
  getBillingStats,
  getInvoices,
  getPaymentMethods,
  getSubscriptionDetails,
} from "./actions";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import Link from "next/link";

interface Props {
  dictionary?: Dictionary;
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-2">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading billing information...</p>
      </div>
    </div>
  );
}

async function BillingContent({ dictionary }: Props) {
  const session = await auth();
  const { schoolId } = await getTenantContext();

  if (!session?.user || !schoolId) {
    redirect("/auth/login");
  }

  // Get locale from session or default to 'ar'
  const locale = "ar";

  // Check if school has a subscription
  const subscriptionResult = await getSubscriptionDetails();

  if (!subscriptionResult.success || !subscriptionResult.data) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <h2>No Active Subscription</h2>
            <p className="muted text-center max-w-md">
              You don&apos;t have an active subscription yet. Please choose a plan to get started with our platform.
            </p>
            <Button asChild>
              <Link href={`/${locale}/pricing`}>View Plans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch all billing data in parallel
  const [statsResult, invoicesResult, paymentMethodsResult] = await Promise.all([
    getBillingStats(),
    getInvoices({ page: 1, limit: 20 }),
    getPaymentMethods(),
  ]);

  if (!statsResult.success) {
    // Throw error to be caught by error.tsx boundary
    throw new Error(statsResult.error || "Failed to load billing data");
  }

  const stats = statsResult.data;
  const invoices = invoicesResult.success ? invoicesResult.data.invoices : [];
  const paymentMethods = paymentMethodsResult.success ? paymentMethodsResult.data : [];

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <BillingPage
        stats={stats}
        subscription={subscriptionResult.data}
        invoices={invoices}
        paymentMethods={paymentMethods}
        dictionary={dictionary}
      />
    </div>
  );
}

export default async function BillingContentWrapper({ dictionary }: Props) {
  return (
    <Suspense fallback={<LoadingState />}>
      <BillingContent dictionary={dictionary} />
    </Suspense>
  );
}
