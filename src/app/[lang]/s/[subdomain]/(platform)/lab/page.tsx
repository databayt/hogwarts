"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardCardsShowcase } from "@/components/platform/lab/dashboard-cards-showcase"
import { ShadcnShowcase } from "@/components/atom/lab/shadcn-showcase/shadcn-showcase"

export default function LabPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Component Lab</h1>
        <p className="text-lg text-muted-foreground">
          Explore our comprehensive component library with dashboard cards and
          shadcn/ui v4 components.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard Cards</TabsTrigger>
          <TabsTrigger value="shadcn">shadcn/ui v4</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardCardsShowcase />
        </TabsContent>

        <TabsContent value="shadcn" className="mt-6">
          <ShadcnShowcase />
        </TabsContent>
      </Tabs>
    </div>
  )
}
