'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatAmount } from '@/components/banking/lib/utils'

interface BankDropdownProps {
  accounts: any[]
  selectedAccount: string
  onSelectAccount: (accountId: string) => void
  dictionary?: any
}

export function BankDropdown({
  accounts,
  selectedAccount,
  onSelectAccount,
  dictionary
}: BankDropdownProps) {
  return (
    <Select value={selectedAccount} onValueChange={onSelectAccount}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={dictionary?.selectAccount || "Select an account"} />
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