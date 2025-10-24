import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantContext } from "@/lib/tenant-context";
import { BillingDashboard } from "./dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { IconLoader2 } from "@tabler/icons-react";
import {
  getBillingStats,
  getInvoices,
  getPaymentMethods,
  getSubscriptionDetails,
} from "./actions";
import type { Dictionary } from "@/components/internationalization/dictionaries";

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

  // Check if school has a subscription
  const subscriptionResult = await getSubscriptionDetails();

  if (!subscriptionResult.success || !subscriptionResult.data) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <h2 className="text-2xl font-bold">No Active Subscription</h2>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have an active subscription yet. Please choose a plan to get started with our platform.
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              View Plans
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch all billing data
  const [
    statsResult,
    invoicesResult,
    paymentMethodsResult,
  ] = await Promise.all([
    getBillingStats(),
    getInvoices({ page: 1, limit: 10 }),
    getPaymentMethods(),
  ]);

  if (!statsResult.success) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <h2 className="text-2xl font-bold">Error Loading Billing Data</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {statsResult.error || "An error occurred while loading your billing information"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = statsResult.data;
  const invoices = invoicesResult.success ? invoicesResult.data.invoices : [];
  const paymentMethods = paymentMethodsResult.success ? paymentMethodsResult.data : [];

  return (
    <div className="container mx-auto py-10">
      <BillingDashboard
        stats={stats}
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
