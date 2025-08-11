import { constructMetadata } from "@/components/marketing/pricing/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChartStacked } from "@/components/marketing/pricing/charts/area-chart-stacked";
import { BarChartMixed } from "@/components/marketing/pricing/charts/bar-chart-mixed";
import { InteractiveBarChart } from "@/components/marketing/pricing/charts/interactive-bar-chart";
import { LineChartMultiple } from "@/components/marketing/pricing/charts/line-chart-multiple";
import { RadarChartSimple } from "@/components/marketing/pricing/charts/radar-chart-simple";
import { RadialChartGrid } from "@/components/marketing/pricing/charts/radial-chart-grid";
import { RadialShapeChart } from "@/components/marketing/pricing/charts/radial-shape-chart";
import { RadialStackedChart } from "@/components/marketing/pricing/charts/radial-stacked-chart";
import { RadialTextChart } from "@/components/marketing/pricing/charts/radial-text-chart";
import { DashboardHeader } from "@/components/marketing/pricing/dashboard/header";

export const metadata = constructMetadata({
  title: "Charts – SaaS Starter",
  description: "List of charts by shadcn-ui",
});

export default function ChartsPage() {
  return (
    <>
      <DashboardHeader heading="Charts" text="List of charts by shadcn-ui." />
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <RadialTextChart />
          <AreaChartStacked />
          <BarChartMixed />
          <RadarChartSimple />
        </div>

        <InteractiveBarChart />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <RadialChartGrid />
          <RadialShapeChart />
          <LineChartMultiple />
          <RadialStackedChart />
        </div>
      </div>
    </>
  );
}
