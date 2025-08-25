"use client";

import { Shell as PageContainer } from '@/components/table/shell';
import { KanbanBoard } from './components/kanban-board';
import NewTaskDialog from './components/new-task-dialog';

export function KanbanContent() {
  return (
    <PageContainer>
      <div className='space-y-4'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-xl font-semibold'>Kanban</h1>
            <p className='text-sm text-muted-foreground'>Manage tasks by drag & drop</p>
          </div>
          <NewTaskDialog />
        </div>
        <KanbanBoard />
      </div>
    </PageContainer>
  );
}
