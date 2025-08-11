"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";

type Totals = {
  totalSchools: number;
  activeSchools: number;
  totalUsers: number;
  totalStudents: number;
};

export function MetricsCards({ totals }: { totals: Totals }) {
  const sp = useSearchParams();
  const period = sp.get("period") ?? "7d";
  const [deltas, setDeltas] = React.useState<{ schools: number; users: number; students: number } | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch(`/operator/overview/metrics?period=${period}`, { cache: "no-store", signal: controller.signal });
        if (!res.ok) return;
        const json = await res.json();
        setDeltas(json.deltas ?? null);
      } catch {
        // ignore
      }
    };
    void run();
    return () => controller.abort();
  }, [period]);

  const fmtPct = (value: number | null | undefined) =>
    value === null || value === undefined ? "+0.0%" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Total Schools</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {totals.totalSchools.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconTrendingUp />
              {fmtPct(deltas?.schools)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            All provisioned schools <IconTrendingUp className='size-4' />
          </div>
          <div className='text-muted-foreground'>Operator-only aggregate metric</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Active Schools</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {totals.activeSchools.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconTrendingDown />
              {fmtPct(deltas?.schools)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Currently active subscriptions <IconTrendingDown className='size-4' />
          </div>
          <div className='text-muted-foreground'>Toggle by plan in future</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {totals.totalUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconTrendingUp />
              {fmtPct(deltas?.users)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Across all schools <IconTrendingUp className='size-4' />
          </div>
          <div className='text-muted-foreground'>Includes all roles</div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Total Students</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {totals.totalStudents.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <IconTrendingUp />
              {fmtPct(deltas?.students)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Student accounts across tenants <IconTrendingUp className='size-4' />
          </div>
          <div className='text-muted-foreground'>More KPIs coming soon</div>
        </CardFooter>
      </Card>
    </div>
  );
}







