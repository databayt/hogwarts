// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatAmount } from "@/components/school-dashboard/finance/banking/lib/utils"

import type { BankCardProps } from "../types"

export function BankCard({
  account,
  userName,
  showBalance = true,
  dictionary,
}: BankCardProps & { dictionary?: Record<string, string> }) {
  const bp = dictionary ?? {}

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
            <span className="muted">
              {bp.accountHolder || "Account holder"}
            </span>
            <small className="font-medium">{userName}</small>
          </div>
          {showBalance && (
            <>
              <div className="flex items-center justify-between">
                <span className="muted">
                  {bp.currentBalance || "Current balance"}
                </span>
                <small className="font-medium">
                  {formatAmount(Number(account.currentBalance))}
                </small>
              </div>
              <div className="flex items-center justify-between">
                <span className="muted">
                  {bp.availableBalance || "Available balance"}
                </span>
                <small className="font-medium">
                  {formatAmount(Number(account.availableBalance))}
                </small>
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="muted">{bp.type || "Type"}</span>
            <small className="font-medium capitalize">{account.type}</small>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
