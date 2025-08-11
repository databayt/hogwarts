import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>403 — Forbidden</CardTitle>
          <CardDescription>
            You dont have permission to access this page.
          </CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <p className="text-sm text-muted-foreground">
            If you think this is a mistake, contact an administrator.
          </p>
          <div className="mt-4">
            <Link href="/dashboard" className="text-primary underline">
              Go back to dashboard
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}


