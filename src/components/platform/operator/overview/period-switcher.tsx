"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function PeriodSwitcher() {
  const sp = useSearchParams();
  const router = useRouter();
  const period = sp.get("period") ?? "7d";

  const onChange = (value: string) => {
    const params = new URLSearchParams(sp.toString());
    params.set("period", value);
    router.replace(`?${params.toString()}`);
  };

  return (
    <Select value={period} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-28">
        <SelectValue placeholder="Period" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7d">Last 7d</SelectItem>
        <SelectItem value="30d">Last 30d</SelectItem>
        <SelectItem value="90d">Last 90d</SelectItem>
      </SelectContent>
    </Select>
  );
}







