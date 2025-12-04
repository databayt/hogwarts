import { PlansRow } from "@/components/marketing/pricing/types";
import { CircleCheck, Info } from "lucide-react";

import { comparePlans, plansColumns } from "@/components/marketing/pricing/config";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HeaderSection } from "@/components/atom/header-section";

export function ComparePlans() {
  const renderCell = (value: string | boolean | null) => {
    if (value === null) return "—";
    if (typeof value === "boolean")
      return value ? <CircleCheck className="mx-auto size-5" /> : "—";
    return value;
  };

  return (
    <div className="w-full py-20">
      <HeaderSection
        title="Compare Plans"
        subtitle="Find the perfect plan tailored for your business needs!"
      />

      <div className="my-10 overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="sticky top-14 z-10 bg-background">
            <tr>
              <th className="sticky left-0 z-20 w-40 bg-background py-5 md:w-1/4"></th>
              {plansColumns.map((col) => (
                <th
                  key={col}
                  className="w-40 bg-background py-5 font-heading text-center text-black capitalize tracking-wide md:w-auto"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="">
            {comparePlans.map((row: PlansRow, index: number) => (
              <tr key={index} className="">
                <td
                  data-tip={row.tooltip ? row.tooltip : ""}
                  className="sticky left-0 bg-background md:bg-transparent"
                >
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <span className="lg:text-base">
                      {row.feature}
                    </span>
                    {row.tooltip && (
                      <Popover>
                        <PopoverTrigger className="rounded p-1 hover:bg-muted">
                          <Info className="size-4 text-muted-foreground" />
                        </PopoverTrigger>
                        <PopoverContent
                          side="top"
                          className="max-w-80 py-3"
                        >
                          {row.tooltip}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </td>
                {plansColumns.map((col) => (
                  <td
                    key={col}
                    className="py-4 text-center text-muted-foreground lg:text-base"
                  >
                    {renderCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
