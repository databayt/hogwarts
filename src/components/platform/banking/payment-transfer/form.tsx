'use client';

import { useActionState, useEffect, useMemo, useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createTransfer } from './actions';
import type { BankAccount } from '../types';
import type { getDictionary } from '@/components/internationalization/dictionaries';
import type { Locale } from '@/components/internationalization/config';

// Utility function to format currency
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface Props {
  accounts: BankAccount[];
  dictionary: Awaited<ReturnType<typeof getDictionary>>['banking'];
  lang: Locale;
}

interface AccountSelectProps {
  accounts: any[]
  selectedAccount: string
  onValueChange: (value: string) => void
  dictionary: any
}

/**
 * AccountSelect - Memoized select component for account selection
 * Only re-renders when accounts or selectedAccount changes
 */
const AccountSelect = useMemo(() => {
  return function AccountSelectComponent({
    accounts,
    selectedAccount,
    onValueChange,
    dictionary,
  }: AccountSelectProps) {
    return (
      <Select value={selectedAccount} onValueChange={onValueChange} name="accountId" required>
        <SelectTrigger id="source-account">
          <SelectValue placeholder={dictionary?.selectAccount || 'Select an account'} />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center justify-between w-full">
                <span>{account.name}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {formatAmount(Number(account.currentBalance))}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
}, [])

function PaymentTransferForm(props: Props) {
  const [selectedFromAccount, setSelectedFromAccount] = useState('');
  const [selectedToAccount, setSelectedToAccount] = useState('');
  const [transferType, setTransferType] = useState<'internal' | 'external'>('internal');
  const [state, formAction, isPending] = useActionState(createTransfer, {
    success: false,
  });

  // Reset form on successful submission
  useEffect(() => {
    if (state.success) {
      setSelectedFromAccount('');
      setSelectedToAccount('');
      // Reset form inputs
      const form = document.getElementById('transfer-form') as HTMLFormElement;
      if (form) form.reset();
    }
  }, [state.success]);

  // Memoize account validation to prevent recalculation
  const selectedAccountData = useMemo(() => {
    return props.accounts.find(acc => acc.id === selectedFromAccount);
  }, [props.accounts, selectedFromAccount]);

  const availableBalance = selectedAccountData?.availableBalance || selectedAccountData?.currentBalance || 0;

  return (
    <form id="transfer-form" action={formAction} className="space-y-6">
      {/* Status Messages */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error.message || 'An error occurred'}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{props.dictionary.transferSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Transfer Type */}
      <div className="space-y-2">
        <Label>{props.dictionary.transferType}</Label>
        <div className="flex gap-4">
          <Button
            type="button"
            variant={transferType === 'internal' ? 'default' : 'outline'}
            onClick={() => setTransferType('internal')}
            size="sm"
          >
            {props.dictionary.betweenMyAccounts}
          </Button>
          <Button
            type="button"
            variant={transferType === 'external' ? 'default' : 'outline'}
            onClick={() => setTransferType('external')}
            size="sm"
          >
            {props.dictionary.toAnotherUser}
          </Button>
        </div>
      </div>

      {/* Source Account */}
      <div className="space-y-2">
        <Label htmlFor="fromAccountId">
          {props.dictionary.fromAccount}
        </Label>
        <Select
          value={selectedFromAccount}
          onValueChange={setSelectedFromAccount}
          name="fromAccountId"
          required
        >
          <SelectTrigger id="fromAccountId">
            <SelectValue placeholder={props.dictionary.selectAccount} />
          </SelectTrigger>
          <SelectContent>
            {props.accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{account.name}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formatCurrency(account.currentBalance)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedAccountData && (
          <p className="text-sm text-muted-foreground">
            {props.dictionary.availableBalance}: {formatCurrency(availableBalance)}
          </p>
        )}
      </div>

      {/* Destination - Internal Transfer */}
      {transferType === 'internal' && (
        <div className="space-y-2">
          <Label htmlFor="toAccountId">
            {props.dictionary.toAccount}
          </Label>
          <Select
            value={selectedToAccount}
            onValueChange={setSelectedToAccount}
            name="toAccountId"
          >
            <SelectTrigger id="toAccountId">
              <SelectValue placeholder={props.dictionary.selectAccount} />
            </SelectTrigger>
            <SelectContent>
              {props.accounts
                .filter(acc => acc.id !== selectedFromAccount)
                .map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{account.name}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {formatCurrency(account.currentBalance)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Destination - External Transfer */}
      {transferType === 'external' && (
        <div className="space-y-2">
          <Label htmlFor="recipientEmail">
            {props.dictionary.recipientEmail}
          </Label>
          <Input
            id="recipientEmail"
            name="recipientEmail"
            type="email"
            placeholder="recipient@example.com"
            disabled={isPending}
          />
        </div>
      )}

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">
          {props.dictionary.amount}
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="amount"
            name="amount"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            max={availableBalance}
            required
            disabled={isPending}
            className="pl-8"
          />
        </div>
        {availableBalance > 0 && (
          <p className="text-xs text-muted-foreground">
            {props.dictionary.maxAmount}: {formatCurrency(availableBalance)}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          {props.dictionary.description}
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder={props.dictionary.descriptionPlaceholder}
          rows={3}
          required
          disabled={isPending}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !selectedFromAccount || (transferType === 'internal' && !selectedToAccount)}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {props.dictionary.processing}
          </>
        ) : (
          props.dictionary.sendTransfer
        )}
      </Button>
    </form>
  );
}

// Utility function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Export memoized component
export default memo(PaymentTransferForm);