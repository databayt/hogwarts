  import Barchart from "./bar-chart";
import DashboardCard from "./card";
import Piechart from "./pie-chart";
import Areachart from "./area-chart";
import Todo from "./to-do";



export default function DashboardContent() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
    <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
      <Barchart />
    </div>
    <div className="bg-primary-foreground p-4 rounded-lg">
      <DashboardCard title="Latest Transactions" />
    </div>
    <div className="bg-primary-foreground p-4 rounded-lg">
      <Piechart />
    </div>
    <div className="bg-primary-foreground p-4 rounded-lg"><Todo/></div>
    <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
      <Areachart />
    </div>
    <div className="bg-primary-foreground p-4 rounded-lg">
      <DashboardCard title="Popular Content" />
    </div>
  </div>
  );
}

