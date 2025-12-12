import { AreaChartStacked } from "./chart-area-stacked"
import { BarChartMixed } from "./chart-bar-mixed"
import { InteractiveBarChart } from "./chart-interactive-bar"
import { LineChartMultiple } from "./chart-line-multiple"
import { RadarChartSimple } from "./chart-radar-simple"
import { RadialChartGrid } from "./chart-radial-grid"
import { RadialShapeChart } from "./chart-radial-shape"
import { RadialStackedChart } from "./chart-radial-stacked"
import { RadialTextChart } from "./chart-radial-text"
import { DashboardHeader } from "./header"
import { type Locale } from "@/components/internationalization/config"
import { type getDictionary } from "@/components/internationalization/dictionaries"

interface ChartsContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
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
  )
}
