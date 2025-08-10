'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

interface StatsErrorProps {
  error: Error;
  reset: () => void; // Add reset function from error boundary
}
export default function StatsError({ error, reset }: StatsErrorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, [error]);

  // the reload fn ensures the refresh is deffered  until the next render phase allowing react to handle any pending states before processing
  const reload = () => {
    startTransition(() => {
      router.refresh();
      reset();
      setOpen(false);
    });
  };
  return (
    <Card className='border-red-500'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <div className='hidden' />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className='flex items-center gap-2'>
                  <IconAlertCircle className='h-4 w-4' /> Error
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Failed to load statistics: {error.message}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className='flex justify-end gap-2'>
                <Button onClick={() => reload()} variant='outline' className='min-w-[120px]' disabled={isPending}>
                  Try again
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className='flex h-[316px] items-center justify-center p-6'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-4 text-sm'>
            Unable to display statistics at this time
          </p>
          <Button
            onClick={() => reload()}
            variant='outline'
            className='min-w-[120px]'
            disabled={isPending}
          >
            Try again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
