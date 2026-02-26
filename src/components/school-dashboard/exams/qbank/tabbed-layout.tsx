"use client"

import type { ReactNode } from "react"
import { BookOpen, Database } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { CatalogBrowseTab } from "./catalog-tab"

interface Props {
  children: ReactNode // The existing QuestionBankTable
}

export function QBankTabbedLayout({ children }: Props) {
  return (
    <Tabs defaultValue="my-questions" className="w-full">
      <TabsList>
        <TabsTrigger value="my-questions" className="gap-2">
          <Database className="size-4" />
          <span className="hidden sm:inline">My Questions</span>
        </TabsTrigger>
        <TabsTrigger value="catalog" className="gap-2">
          <BookOpen className="size-4" />
          <span className="hidden sm:inline">Catalog</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="my-questions">{children}</TabsContent>
      <TabsContent value="catalog">
        <CatalogBrowseTab />
      </TabsContent>
    </Tabs>
  )
}
