import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatAmount } from "@/components/platform/finance/banking/lib/utils"

import type { BankCardProps } from "../types"

export function BankCard({
  account,
  userName,
  showBalance = true,
}: BankCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <h5>{account.name}</h5>
          <p className="muted">{account.officialName || account.name}</p>
        </div>
        {account.mask && <p className="muted">•••• {account.mask}</p>}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="muted">Account holder</span>
            <small className="font-medium">{userName}</small>
          </div>
          {showBalance && (
            <>
              <div className="flex items-center justify-between">
                <span className="muted">Current balance</span>
                <small className="font-medium">
                  {formatAmount(Number(account.currentBalance))}
                </small>
              </div>
              <div className="flex items-center justify-between">
                <span className="muted">Available balance</span>
                <small className="font-medium">
                  {formatAmount(Number(account.availableBalance))}
                </small>
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="muted">Type</span>
            <small className="font-medium capitalize">{account.type}</small>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
