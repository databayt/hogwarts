"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
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

export type TrendDirection = "up" | "down";

export interface KpiCardProps {
  title: string;
  value: number;
  delta: number | null | undefined;
  trend: TrendDirection;
  supportingText: string;
  footerHint?: string;
  container?: boolean;
  className?: string;
}

function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "+0.0%";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function KpiCard({
  title,
  value,
  delta,
  trend,
  supportingText,
  footerHint,
  container,
  className,
}: KpiCardProps): React.ReactElement {
  const Icon = trend === "up" ? IconTrendingUp : IconTrendingDown;

  return (
    <Card className={cn("bg-muted shadow-none border-none", container && "@container/card", className)}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-extrabold tabular-nums @[250px]/card:text-3xl">
          {value.toLocaleString()}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <Icon />
            {formatPercentage(delta)}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {supportingText} <Icon className="size-4" />
        </div>
        {footerHint ? (
          <div className="text-muted-foreground">{footerHint}</div>
        ) : (
          <div className="text-muted-foreground">&nbsp;</div>
        )}
      </CardFooter>
    </Card>
  );
}


