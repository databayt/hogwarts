"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface ChartAreaInteractiveProps {
  data?: any;
}

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment Statistics</CardTitle>
        <CardDescription>
          Overview of course enrollments over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center space-y-2">
            <TrendingUp className="mx-auto size-12 text-muted-foreground" />
            <p className="muted">Chart visualization placeholder</p>
            <p className="text-xs text-muted-foreground">
              TODO: Implement chart with Recharts
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
