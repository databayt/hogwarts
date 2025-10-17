import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Main Content Area */}
      <div className="flex-1 space-y-8 p-8">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>

        {/* Balance Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-7 w-32 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Account Tabs Skeleton */}
        <div className="w-full">
          <div className="flex gap-2 border-b pb-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-64 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-9 w-20 bg-muted animate-pulse rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar Skeleton */}
      <aside className="hidden xl:flex xl:w-80 xl:flex-col xl:border-l">
        <div className="flex h-full flex-col gap-6 p-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-20 w-full bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </aside>
    </div>
  );
}