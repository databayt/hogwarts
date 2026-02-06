"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatAmount } from "@/components/school-dashboard/finance/banking/lib/utils"

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
  dictionary,
}: BankDropdownProps) {
  return (
    <Select value={selectedAccount} onValueChange={onSelectAccount}>
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={dictionary?.selectAccount || "Select an account"}
        />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <div className="flex w-full items-center justify-between">
              <span>{account.name}</span>
              <span className="text-muted-foreground ms-2 text-sm">
                {formatAmount(Number(account.currentBalance))}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
