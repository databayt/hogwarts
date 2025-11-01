import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/atom/page-header";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        variant="dashboard"
        className="text-start max-w-none"
      />
      <Skeleton className="size-full rounded-lg" />
    </div>
  );
}
