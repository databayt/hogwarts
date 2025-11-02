/**
 * Shared types for kanban feature
 */

import { UniqueIdentifier } from '@dnd-kit/core';

export type Status = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Column {
  id: UniqueIdentifier;
  title: string;
}

export type ColumnType = 'Column';

export interface ColumnDragData {
  type: ColumnType;
  column: Column;
}

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: Status;
};
