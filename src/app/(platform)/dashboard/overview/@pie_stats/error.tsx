'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { IconAlertCircle } from '@tabler/icons-react';

export default function PieStatsError({ error }: { error: Error }) {
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <IconAlertCircle className='h-4 w-4' /> Error
          </AlertDialogTitle>
          <AlertDialogDescription>
            Failed to load pie statistics: {error.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
