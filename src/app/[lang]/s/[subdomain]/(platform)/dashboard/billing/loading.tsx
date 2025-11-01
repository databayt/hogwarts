import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/atom/page-header";
import { CardSkeleton } from "@/components/marketing/pricing/shared/card-skeleton";

export default function DashboardBillingLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage billing and your subscription plan."
        className="text-start max-w-none"
      />
      <div className="grid gap-8">
        <Skeleton className="h-28 w-full rounded-lg md:h-24" />
        <CardSkeleton />
      </div>
    </div>
  );
}
