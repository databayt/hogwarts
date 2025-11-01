import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/atom/page-header";

export default function ChartsLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Charts"
        description="List of charts by shadcn-ui."
        className="text-start max-w-none"
      />
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <Skeleton className="h-80 w-full rounded-lg md:max-xl:h-[390px] xl:max-2xl:h-[420px]" />
          <Skeleton className="h-80 w-full rounded-lg md:max-xl:h-[390px] xl:max-2xl:h-[420px]" />
          <Skeleton className="h-80 w-full rounded-lg md:max-xl:h-[390px] xl:max-2xl:h-[420px]" />
          <Skeleton className="h-80 w-full rounded-lg md:max-xl:h-[390px] xl:max-2xl:h-[420px]" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-lg" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    </div>
  );
}
