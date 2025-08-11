import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/components/marketing/pricing/lib/session";
import { getUserSubscriptionPlan } from "@/components/marketing/pricing/lib/subscription";
import { constructMetadata } from "@/components/marketing/pricing/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DashboardHeader } from "@/components/marketing/pricing/dashboard/header";
import { BillingInfo } from "@/components/marketing/pricing/pricing/billing-info";
import { Icons } from "@/components/marketing/pricing/shared/icons";

export const metadata = constructMetadata({
  title: "Billing – SaaS Starter",
  description: "Manage billing and your subscription plan.",
});

export default async function BillingPage() {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    redirect("/login");
  }

  const isPrivileged = ["DEVELOPER", "ADMIN", "ACCOUNTANT"].includes(
    String(user.role || "")
  );

  const userSubscriptionPlan = await getUserSubscriptionPlan(user.id);

  let schoolSubscriptions = [] as Array<{
    id: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    stripePriceId: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    status: string;
  }>;

  let schoolInvoices = [] as Array<{
    id: string;
    stripeInvoiceId: string;
    amountDue: number;
    amountPaid: number;
    currency: string;
    status: string;
    periodStart: Date;
    periodEnd: Date;
  }>;

  if (isPrivileged && user.schoolId) {
    [schoolSubscriptions, schoolInvoices] = await Promise.all([
      db.subscription.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { createdAt: "desc" },
      }),
      db.invoice.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { createdAt: "desc" },
      }),
    ]);
  }

  return (
    <>
      <DashboardHeader
        heading="Billing"
        text="Manage billing and your subscription plan."
      />
      <div className="grid gap-8">
        <Alert className="!pl-14">
          <Icons.warning />
          <AlertTitle>This is a demo app.</AlertTitle>
          <AlertDescription className="text-balance">
            SaaS Starter app is a demo app using a Stripe test environment. You
            can find a list of test card numbers on the{" "}
            <a
              href="https://stripe.com/docs/testing#cards"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-8"
            >
              Stripe docs
            </a>
            .
          </AlertDescription>
        </Alert>
        <BillingInfo userSubscriptionPlan={userSubscriptionPlan} />

        {isPrivileged && (
          <div className="space-y-10">
            <div>
              <h3 className="mb-3 text-lg font-semibold">Subscriptions</h3>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Stripe Sub ID</th>
                      <th className="px-3 py-2 text-left">Price ID</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Current Period End</th>
                      <th className="px-3 py-2 text-left">Cancel at Period End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolSubscriptions.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                          No subscriptions found for this school.
                        </td>
                      </tr>
                    ) : (
                      schoolSubscriptions.map((s) => (
                        <tr key={s.id} className="border-t">
                          <td className="px-3 py-2 font-mono">{s.stripeSubscriptionId}</td>
                          <td className="px-3 py-2 font-mono">{s.stripePriceId}</td>
                          <td className="px-3 py-2">{s.status}</td>
                          <td className="px-3 py-2">{new Date(s.currentPeriodEnd).toLocaleString()}</td>
                          <td className="px-3 py-2">{s.cancelAtPeriodEnd ? "Yes" : "No"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold">Invoices</h3>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Stripe Invoice ID</th>
                      <th className="px-3 py-2 text-left">Amount Paid</th>
                      <th className="px-3 py-2 text-left">Currency</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolInvoices.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                          No invoices found for this school.
                        </td>
                      </tr>
                    ) : (
                      schoolInvoices.map((inv) => (
                        <tr key={inv.id} className="border-t">
                          <td className="px-3 py-2 font-mono">{inv.stripeInvoiceId}</td>
                          <td className="px-3 py-2">
                            {(inv.amountPaid / 100).toLocaleString(undefined, { style: "currency", currency: (inv.currency || "USD").toUpperCase() })}
                          </td>
                          <td className="px-3 py-2 uppercase">{inv.currency}</td>
                          <td className="px-3 py-2">{inv.status}</td>
                          <td className="px-3 py-2">{new Date(inv.periodStart).toLocaleDateString()} → {new Date(inv.periodEnd).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
