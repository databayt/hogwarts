import { SkeletonDataTable } from "@/components/atom/loading"

export default function Loading() {
  return <SkeletonDataTable columns={5} rows={8} />
}
