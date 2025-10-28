'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { removeBank, syncBankData } from './actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  accountId: string;
  accountName: string;
  dictionary: any;
}

export default function BankActions(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncBankData({ accountId: props.accountId });
      if (result.success) {
        toast.success(props.dictionary.syncSuccess || 'Bank data synced successfully');
        router.refresh();
      } else {
        toast.error(result.error?.message || 'Failed to sync bank data');
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await removeBank({ accountId: props.accountId });
      if (result.success) {
        toast.success(props.dictionary.removeSuccess || 'Bank account removed successfully');
        router.refresh();
      } else {
        toast.error(result.error?.message || 'Failed to remove bank account');
      }
      setShowDeleteDialog(false);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSync} disabled={isPending}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {props.dictionary.syncData || 'Sync Data'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPending}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {props.dictionary.remove || 'Remove'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{props.dictionary.confirmRemove || 'Remove Bank Account?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {props.dictionary.removeDescription ||
                `Are you sure you want to remove ${props.accountName}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{props.dictionary.cancel || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {props.dictionary.remove || 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}