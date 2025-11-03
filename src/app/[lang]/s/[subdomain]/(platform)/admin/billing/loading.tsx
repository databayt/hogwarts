import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/marketing/pricing/shared/card-skeleton";

export default function AdminBillingLoading() {
  return (
    <div className="grid gap-8">
      <Skeleton className="h-28 w-full rounded-lg md:h-24" />
      <CardSkeleton />
    </div>
  );
}
