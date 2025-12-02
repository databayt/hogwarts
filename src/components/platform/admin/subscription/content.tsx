import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Package, Receipt, Tag, TrendingUp, DollarSign, Users, Calendar,  } from "lucide-react"
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

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
        db.subscription.count({
          where: { schoolId, status: 'ACTIVE' }
        }).catch(() => 0),
        db.subscriptionTier.count().catch(() => 0),
      ])
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Subscription Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Current subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,345</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Tiers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionTiers}</div>
            <p className="text-xs text-muted-foreground">Available plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5%</div>
            <p className="text-xs text-muted-foreground">Monthly average</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Management */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscription Tiers */}
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Subscription Tiers
            </CardTitle>
            <CardDescription>Manage pricing plans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Configure subscription tiers, features, and pricing for different plans.
            </p>
            <Button asChild>
              <Link href={`/${lang}/admin/subscription/tiers`}>
                Manage Tiers
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Billing Settings */}
        <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Billing Settings
            </CardTitle>
            <CardDescription>Payment configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
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
        <Card className="border-green-500/20 hover:border-green-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-green-500" />
              Discount Codes
            </CardTitle>
            <CardDescription>Promotional offers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
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
        <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Revenue Analytics
            </CardTitle>
            <CardDescription>Financial insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Track revenue trends, subscription metrics, and financial performance.
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