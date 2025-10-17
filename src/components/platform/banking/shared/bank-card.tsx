import { formatAmount } from '@/components/banking/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { BankCardProps } from '../types'

export function BankCard({ account, userName, showBalance = true }: BankCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <p className="text-lg font-semibold">{account.name}</p>
          <p className="text-sm text-muted-foreground">
            {account.officialName || account.name}
          </p>
        </div>
        {account.mask && (
          <p className="text-sm text-muted-foreground">
            •••• {account.mask}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Account holder</span>
            <span className="text-sm font-medium">{userName}</span>
          </div>
          {showBalance && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current balance</span>
                <span className="text-sm font-medium">
                  {formatAmount(Number(account.currentBalance))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available balance</span>
                <span className="text-sm font-medium">
                  {formatAmount(Number(account.availableBalance))}
                </span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium capitalize">
              {account.type}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}