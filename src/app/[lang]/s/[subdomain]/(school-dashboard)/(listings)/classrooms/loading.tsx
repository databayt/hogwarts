import { SkeletonDataTable } from "@/components/atom/loading"

export default function Loading() {
  return <SkeletonDataTable columns={6} rows={8} />
}
