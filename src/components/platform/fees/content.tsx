import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeeDashboard } from "./dashboard";
import { FeeStructuresList } from "./fee-structures-list";
import { PaymentsList } from "./payments-list";
import { ScholarshipsList } from "./scholarships-list";
import { RefundsList } from "./refunds-list";
import { getFeeStats, getFeeStructures, getPayments, getScholarships } from "./actions";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface Props {
  dictionary?: Dictionary;
}

export default async function FeesContent({ dictionary }: Props) {
  // Fetch initial data
  const [stats, structures, payments, scholarships] = await Promise.all([
    getFeeStats(),
    getFeeStructures(),
    getPayments(),
    getScholarships(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1>Fee Management</h1>
        <p className="text-muted-foreground">
          Manage fee structures, payments, scholarships, and refunds
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <FeeDashboard stats={stats} dictionary={dictionary} />
      </Suspense>

      <Tabs defaultValue="structures" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="structures">
            Fee Structures
          </TabsTrigger>
          <TabsTrigger value="payments">
            Payments
          </TabsTrigger>
          <TabsTrigger value="scholarships">
            Scholarships
          </TabsTrigger>
          <TabsTrigger value="refunds">
            Refunds
          </TabsTrigger>
          <TabsTrigger value="reports">
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structures" className="space-y-4">
          <FeeStructuresList structures={structures} dictionary={dictionary} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentsList payments={payments} dictionary={dictionary} />
        </TabsContent>

        <TabsContent value="scholarships" className="space-y-4">
          <ScholarshipsList scholarships={scholarships} dictionary={dictionary} />
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <RefundsList dictionary={dictionary} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="text-center py-12 text-muted-foreground">
            Financial reports coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}