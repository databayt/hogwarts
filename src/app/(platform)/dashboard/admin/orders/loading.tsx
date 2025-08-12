import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/platform/dashboard/header";

export default function OrdersLoading() {
  return (
    <>
      <DashboardHeader
        heading="Orders"
        text="Check and manage your latest orders."
      />
      <Skeleton className="size-full rounded-lg" />
    </>
  );
}
