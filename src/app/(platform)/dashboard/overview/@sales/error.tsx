'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { IconAlertCircle } from '@tabler/icons-react';

export default function SalesError({ error }: { error: Error }) {
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <IconAlertCircle className='h-4 w-4' /> Error
          </AlertDialogTitle>
          <AlertDialogDescription>
            Failed to load sales data: {error.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
