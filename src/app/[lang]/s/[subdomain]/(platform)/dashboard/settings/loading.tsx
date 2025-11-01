import PageHeader from "@/components/atom/page-header";
import { SkeletonSection } from "@/components/marketing/pricing/shared/section-skeleton";

export default function DashboardSettingsLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage account and website settings."
        className="text-start max-w-none"
      />
      <div className="divide-y divide-muted pb-10">
        <SkeletonSection />
        <SkeletonSection />
        <SkeletonSection card />
      </div>
    </div>
  );
}
