"use client"

import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { Shell as PageContainer } from "@/components/table/shell"

import { KanbanBoard } from "./components/kanban-board"
import NewTaskDialog from "./components/new-task-dialog"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export function KanbanContent(props: Props) {
  return (
    <PageContainer>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">Kanban</h1>
            <p className="text-muted-foreground text-sm">
              Manage tasks by drag & drop
            </p>
          </div>
          <NewTaskDialog />
        </div>
        <KanbanBoard />
      </div>
    </PageContainer>
  )
}
