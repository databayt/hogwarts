"use client";

import * as React from "react";
import { useQueryState } from "nuqs";
import { Input } from "@/components/ui/input";

export function QuickSearch() {
  const [q, setQ] = useQueryState("q");
  return (
    <div className="w-full max-w-xs">
      <Input
        value={q ?? ""}
        onChange={(e) => setQ(e.target.value || null)}
        placeholder="Quick search"
        className="h-8"
      />
    </div>
  );
}


