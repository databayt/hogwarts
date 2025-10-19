"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface Props {
  dictionary?: Dictionary;
}

export function RefundsList({ dictionary }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Refunds</CardTitle>
        <CardDescription>
          Process and track refund requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          No refund requests at this time
        </div>
      </CardContent>
    </Card>
  );
}