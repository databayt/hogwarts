import { Metadata } from "next"

import { FinanceDashboardContent } from "@/components/platform/finance/dashboard/content"

export const metadata: Metadata = {
  title: "Financial Dashboard | Finance",
  description:
    "Comprehensive financial overview and key performance indicators",
}

export default function FinanceDashboardPage() {
  return <FinanceDashboardContent />
}
