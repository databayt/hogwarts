import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function GradeDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Info Card Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Info Card Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          </CardContent>
        </Card>

        {/* Score Card Skeleton - Full Width */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-4 w-12 mt-2" />
              </div>
              <div className="flex flex-col justify-center gap-2 p-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50">
                <Skeleton className="h-10 w-12" />
                <Skeleton className="h-4 w-12 mt-2" />
              </div>
              <div className="flex flex-col justify-center gap-2 p-4">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Card Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          </CardContent>
        </Card>

        {/* Grade History Card Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-[120px] w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Class Comparison Card Skeleton - Full Width */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24 mt-1" />
                </div>
              </div>
              <Skeleton className="h-[150px] w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
