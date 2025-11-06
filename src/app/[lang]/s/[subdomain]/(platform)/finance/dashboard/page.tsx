import { FinanceDashboardContent } from "@/components/platform/finance/dashboard/content"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Financial Dashboard | Finance",
  description: "Comprehensive financial overview and key performance indicators"
}

export default function FinanceDashboardPage() {
  return <FinanceDashboardContent />
}