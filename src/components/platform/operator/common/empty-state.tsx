"use client";

import { Card } from "@/components/ui/card";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
      <div className="text-base font-medium text-foreground">{title}</div>
      {description ? <div>{description}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </Card>
  );
}
















