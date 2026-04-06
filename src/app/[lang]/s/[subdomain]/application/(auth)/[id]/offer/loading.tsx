import { Skeleton } from "@/components/ui/skeleton"

export default function OfferLoading() {
  return (
    <div className="min-h-screen py-6 sm:py-12">
      <div className="container mx-auto max-w-3xl space-y-6 px-4">
        <div className="text-center">
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="mx-auto mt-2 h-5 w-48" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  )
}
