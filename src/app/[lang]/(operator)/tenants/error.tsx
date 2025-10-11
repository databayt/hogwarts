"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, RefreshCw } from "lucide-react";

export default function TenantsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Tenants error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle>Tenant Management Error</CardTitle>
          <CardDescription>
            Unable to load tenant information. Please try again.
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
            Retry loading tenants
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}