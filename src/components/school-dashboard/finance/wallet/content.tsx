// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  CircleArrowDown,
  CircleArrowUp,
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  DashboardGrid,
  FeatureCard,
  formatCurrency,
  StatsCard,
} from "../lib/dashboard-components"
import { checkCurrentUserPermission } from "../lib/permissions"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function WalletContent({ dictionary, lang }: Props) {
  const fd = (dictionary as any)?.finance
  const c = fd?.common as Record<string, string> | undefined

  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <div>
        <p className="text-muted-foreground">
          {c?.schoolNotFound || "School context not found"}
        </p>
      </div>
    )
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(schoolId, "wallet", "view")
  const canCreate = await checkCurrentUserPermission(
    schoolId,
    "wallet",
    "create"
  )
  const canEdit = await checkCurrentUserPermission(schoolId, "wallet", "edit")
  const canProcess = await checkCurrentUserPermission(
    schoolId,
    "wallet",
    "process"
  )
  const canExport = await checkCurrentUserPermission(
    schoolId,
    "wallet",
    "export"
  )

  // If user can't view wallet, show empty state
  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">
          {c?.noPermissionWallet || "You don't have permission to view wallet"}
        </p>
      </div>
    )
  }

  let walletsCount = 0
  let transactionsCount = 0
  let totalBalance = 0
  let totalTopups = 0

  if (schoolId) {
    try {
      ;[walletsCount, transactionsCount] = await Promise.all([
        db.wallet.count({ where: { schoolId, isActive: true } }),
        db.walletTransaction.count({ where: { schoolId } }),
      ])

      const [balanceAgg, topupsAgg] = await Promise.all([
        db.wallet.aggregate({
          where: { schoolId, isActive: true },
          _sum: { balance: true },
        }),
        db.walletTransaction.aggregate({
          where: { schoolId, type: "CREDIT" },
          _sum: { amount: true },
        }),
      ])

      totalBalance = balanceAgg._sum?.balance
        ? Number(balanceAgg._sum.balance)
        : 0
      totalTopups = topupsAgg._sum?.amount ? Number(topupsAgg._sum.amount) : 0
    } catch (error) {
      console.error("Error fetching wallet stats:", error)
    }
  }

  const wp = fd?.walletPage as Record<string, string> | undefined

  return (
    <div className="space-y-6">
      <DashboardGrid type="stats">
        <StatsCard
          title={wp?.totalBalance || "Total Balance"}
          value={formatCurrency(totalBalance)}
          description={wp?.acrossAllWallets || "Across all wallets"}
          icon={DollarSign}
        />
        <StatsCard
          title={wp?.activeWallets || "Active Wallets"}
          value={walletsCount}
          description={`${wp?.schoolWallets || "School"} & ${wp?.parentWallets || "parent wallets"}`}
          icon={Wallet}
        />
        <StatsCard
          title={wp?.transactions || "Transactions"}
          value={transactionsCount}
          description={wp?.allTimeTransactions || "All time transactions"}
          icon={TrendingUp}
        />
        <StatsCard
          title={wp?.totalTopUps || "Total Top-ups"}
          value={formatCurrency(totalTopups)}
          description={wp?.lifetimeTopUps || "Lifetime top-ups"}
          icon={CircleArrowUp}
        />
      </DashboardGrid>

      <DashboardGrid type="features">
        <FeatureCard
          title={wp?.allWallets || "All Wallets"}
          description={
            wp?.viewManageWallets || "View and manage all wallet accounts"
          }
          icon={Wallet}
          isPrimary
          primaryAction={{
            label: wp?.viewWallets || "View Wallets",
            href: `/${lang}/finance/wallet/all`,
            count: walletsCount,
          }}
          secondaryAction={
            canCreate
              ? {
                  label: wp?.createWallet || "Create Wallet",
                  href: `/${lang}/finance/wallet/new`,
                }
              : undefined
          }
        />
        {canProcess && (
          <FeatureCard
            title={wp?.topUpWallet || "Top-up Wallet"}
            description={
              wp?.addFundsToWallets || "Add funds to parent or school wallets"
            }
            icon={CircleArrowUp}
            primaryAction={{
              label: wp?.topUp || "Top-up",
              href: `/${lang}/finance/wallet/topup`,
            }}
            secondaryAction={{
              label: wp?.bulkTopUp || "Bulk Top-up",
              href: `/${lang}/finance/wallet/topup/bulk`,
            }}
          />
        )}
        <FeatureCard
          title={wp?.transactions || "Transactions"}
          description={
            wp?.viewTransactionHistory || "View wallet transaction history"
          }
          icon={TrendingUp}
          primaryAction={{
            label: wp?.viewTransactions || "View Transactions",
            href: `/${lang}/finance/wallet/transactions`,
          }}
          secondaryAction={
            canExport
              ? {
                  label: fd?.export || "Export",
                  href: `/${lang}/finance/wallet/transactions/export`,
                }
              : undefined
          }
        />
        {canProcess && (
          <FeatureCard
            title={wp?.refunds || "Refunds"}
            description={
              wp?.processRefunds || "Process wallet refunds and adjustments"
            }
            icon={CircleArrowDown}
            primaryAction={{
              label: wp?.processRefund || "Process Refund",
              href: `/${lang}/finance/wallet/refund`,
            }}
            secondaryAction={{
              label: wp?.refundHistory || "Refund History",
              href: `/${lang}/finance/wallet/refund/history`,
            }}
          />
        )}
        <FeatureCard
          title={wp?.parentWallets || "Parent Wallets"}
          description={
            wp?.manageParentWallets || "Manage parent wallet accounts"
          }
          icon={Users}
          primaryAction={{
            label: wp?.viewParentWallets || "View Parent Wallets",
            href: `/${lang}/finance/wallet/parents`,
          }}
          secondaryAction={{
            label: wp?.statements || "Statements",
            href: `/${lang}/finance/wallet/parents/statements`,
          }}
        />
        {canExport && (
          <FeatureCard
            title={wp?.walletReports || "Wallet Reports"}
            description={
              wp?.generateWalletReports ||
              "Generate wallet balance and transaction reports"
            }
            icon={DollarSign}
            primaryAction={{
              label: c?.viewReports || "View Reports",
              href: `/${lang}/finance/wallet/reports`,
            }}
            secondaryAction={{
              label: wp?.balanceSheet || "Balance Sheet",
              href: `/${lang}/finance/wallet/reports/balance`,
            }}
          />
        )}
      </DashboardGrid>
    </div>
  )
}
