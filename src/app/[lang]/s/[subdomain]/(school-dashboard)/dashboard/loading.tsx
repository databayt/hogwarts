import { DashboardSkeleton } from "@/components/school-dashboard/loading"

/**
 * Covers only the page's own await — params, dictionary, and the session read
 * that resolves the role. Everything slower than that (the role dashboard and
 * its queries) suspends into the boundary inside `page.tsx`, which DOES know
 * the role and draws that role's own shape. So this one is deliberately
 * role-blind: see `DashboardSkeleton`'s neutral body.
 */
export default function Loading() {
  return <DashboardSkeleton />
}
