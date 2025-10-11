"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, RefreshCw } from "lucide-react";

export default function DomainsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Domains error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Domain Management Error</CardTitle>
          <CardDescription>
            Failed to load domain requests. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.message && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                {error.message}
              </p>
            </div>
          )}
          <Button
            onClick={() => reset()}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry loading domains
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}