import { Skeleton } from "@/components/ui/skeleton";
import { AreaChartStacked } from "@/components/platform/dashboard/charts/area-chart-stacked";
import { BarChartMixed } from "@/components/platform/dashboard/charts/bar-chart-mixed";
import { InteractiveBarChart } from "@/components/platform/dashboard/charts/interactive-bar-chart";
import { LineChartMultiple } from "@/components/platform/dashboard/charts/line-chart-multiple";
import { RadarChartSimple } from "@/components/platform/dashboard/charts/radar-chart-simple";
import { RadialChartGrid } from "@/components/platform/dashboard/charts/radial-chart-grid";
import { RadialShapeChart } from "@/components/platform/dashboard/charts/radial-shape-chart";
import { RadialStackedChart } from "@/components/platform/dashboard/charts/radial-stacked-chart";
import { RadialTextChart } from "@/components/platform/dashboard/charts/radial-text-chart";
import { DashboardHeader } from "@/components/platform/dashboard/header";
import { type Locale } from "@/components/internationalization/config";
import { type getDictionary } from "@/components/internationalization/dictionaries";

interface ChartsContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
}

export default function ChartsContent({ dictionary, lang }: ChartsContentProps) {
  return (
    <>
      <DashboardHeader heading="Charts" text="List of charts by shadcn-ui." />
      <div className="flex flex-col gap-6 py-4 pb-14">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-4">
          <RadialTextChart />
          <AreaChartStacked />
          <BarChartMixed />
          <RadarChartSimple />
        </div>

        <InteractiveBarChart />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-4">
          <RadialChartGrid />
          <RadialShapeChart />
          <LineChartMultiple />
          <RadialStackedChart />
        </div>
      </div>
    </>
  );
}
