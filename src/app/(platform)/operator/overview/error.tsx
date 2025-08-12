"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="text-lg font-semibold">Something went wrong</div>
      <div className="text-sm text-muted-foreground">{error.message || "Unknown error"}</div>
      <Button size="sm" onClick={() => reset()}>Try again</Button>
    </div>
  );
}
