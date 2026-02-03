import Link from "next/link"
import {
  Calendar,
  CreditCard,
  DollarSign,
  Package,
  Receipt,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function SubscriptionContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()
  const d = dictionary?.admin

  let activeSubscriptions = 0
  const totalRevenue = 0
  let subscriptionTiers = 0

  if (schoolId) {
    try {
      ;[activeSubscriptions, subscriptionTiers] = await Promise.all([
        db.subscription
          .count({
            where: { schoolId, status: "ACTIVE" },
          })
          .catch(() => 0),
        db.subscriptionTier.count().catch(() => 0),
      ])
    } catch (error) {
      console.error("Error fetching subscription data:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Subscription Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Subscriptions
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-muted-foreground text-xs">Current subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,345</div>
            <p className="text-muted-foreground text-xs">
              +15% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Subscription Tiers
            </CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionTiers}</div>
            <p className="text-muted-foreground text-xs">Available plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5%</div>
            <p className="text-muted-foreground text-xs">Monthly average</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Management */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscription Tiers */}
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="text-primary h-5 w-5" />
              Subscription Tiers
            </CardTitle>
            <CardDescription>Manage pricing plans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Configure subscription tiers, features, and pricing for different
              plans.
            </p>
            <Button asChild>
              <Link href={`/${lang}/admin/subscription/tiers`}>
                Manage Tiers
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Billing Settings */}
        <Card className="border-blue-500/20 transition-colors hover:border-blue-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Billing Settings
            </CardTitle>
            <CardDescription>Payment configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Configure billing cycles, payment methods, and invoice settings.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/admin/subscription/billing`}>
                Configure Billing
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Discount Codes */}
        <Card className="border-green-500/20 transition-colors hover:border-green-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-green-500" />
              Discount Codes
            </CardTitle>
            <CardDescription>Promotional offers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Create and manage discount codes, coupons, and special offers.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/admin/subscription/discounts`}>
                Manage Discounts
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Revenue Analytics */}
        <Card className="border-purple-500/20 transition-colors hover:border-purple-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Revenue Analytics
            </CardTitle>
            <CardDescription>Financial insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Track revenue trends, subscription metrics, and financial
              performance.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/admin/subscription/analytics`}>
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
