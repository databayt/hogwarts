"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AuditRow } from "../logs-table/columns";

interface ObservabilityData {
  rows: AuditRow[];
}

export function useObservabilityData() {
  const [data, setData] = useState<ObservabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchObservabilityData() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams(searchParams);
        const response = await fetch(`/api/observability?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch observability data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchObservabilityData();
  }, [searchParams]);

  return { data, isLoading, error };
}
