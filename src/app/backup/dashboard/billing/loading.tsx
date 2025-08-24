import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/platform/dashboard/header";
import { CardSkeleton } from "@/components/marketing/pricing/shared/card-skeleton";

export default function DashboardBillingLoading() {
  return (
    <>
      <DashboardHeader
        heading="Billing"
        text="Manage billing and your subscription plan."
      />
      <div className="grid gap-8">
        <Skeleton className="h-28 w-full rounded-lg md:h-24" />
        <CardSkeleton />
      </div>
    </>
  );
}
