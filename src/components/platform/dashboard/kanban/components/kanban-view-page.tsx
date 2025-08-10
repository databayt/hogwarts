import { Shell as PageContainer } from '@/components/table/shell';
// Replace missing Heading with inline markup
import { KanbanBoard } from './kanban-board';
import NewTaskDialog from './new-task-dialog';

export default function KanbanViewPage() {
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
