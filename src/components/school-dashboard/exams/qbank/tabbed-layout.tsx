"use client"

import type { ReactNode } from "react"
import { BookOpen, Database } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import { CatalogBrowseTab } from "./catalog-tab"
import { qbankT } from "./t"

interface Props {
  children: ReactNode // The existing QuestionBankTable
}

export function QBankTabbedLayout({ children }: Props) {
  const t = qbankT(useDictionaryFallback<any>()).tabbedLayout
  return (
    <Tabs defaultValue="my-questions" className="w-full">
      <TabsList>
        <TabsTrigger
          value="my-questions"
          className="min-h-11 gap-2"
          aria-label={t?.myQuestions ?? ""}
        >
          <Database className="size-4" />
          <span className="hidden sm:inline">{t?.myQuestions ?? ""}</span>
        </TabsTrigger>
        <TabsTrigger
          value="catalog"
          className="min-h-11 gap-2"
          aria-label={t?.catalog ?? ""}
        >
          <BookOpen className="size-4" />
          <span className="hidden sm:inline">{t?.catalog ?? ""}</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="my-questions">{children}</TabsContent>
      <TabsContent value="catalog">
        <CatalogBrowseTab />
      </TabsContent>
    </Tabs>
  )
}
