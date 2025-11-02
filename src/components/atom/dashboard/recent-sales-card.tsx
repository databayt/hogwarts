import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import type { CardSize } from "./types"

interface SaleItem {
  /**
   * User avatar URL
   */
  avatar?: string
  /**
   * User name
   */
  name: string
  /**
   * User email or subtitle
   */
  email: string
  /**
   * Sale amount (formatted with currency)
   */
  amount: string
  /**
   * Optional trend or additional info
   */
  badge?: React.ReactNode
}

interface RecentSalesCardProps {
  /**
   * Card title
   */
  title?: string
  /**
   * Card description/subtitle
   */
  description?: string
  /**
   * List of recent sales
   */
  sales: SaleItem[]
  /**
   * Maximum items to display
   * @default 5
   */
  maxItems?: number
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Action button in header
   */
  action?: React.ReactNode
  /**
   * Empty state message
   */
  emptyMessage?: string
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * RecentSalesCard - Recent transactions/sales list
 *
 * Perfect for displaying recent financial transactions, customer purchases, or payment history.
 * Shows avatar, name, email, and amount in a clean list format.
 *
 * Based on shadcn/ui dashboard example pattern.
 *
 * @example
 * ```tsx
 * <RecentSalesCard
 *   title="Recent Sales"
 *   description="You made 265 sales this month"
 *   sales={[
 *     {
 *       avatar: "/avatars/01.png",
 *       name: "Olivia Martin",
 *       email: "olivia.martin@email.com",
 *       amount: "+$1,999.00"
 *     },
 *     {
 *       name: "Jackson Lee",
 *       email: "jackson.lee@email.com",
 *       amount: "+$39.00"
 *     }
 *   ]}
 *   maxItems={5}
 *   action={<Button variant="ghost" size="sm">View All</Button>}
 * />
 * ```
 */
export function RecentSalesCard({
  title = "Recent Sales",
  description,
  sales,
  maxItems = 5,
  size = "md",
  loading = false,
  action,
  emptyMessage = "No recent sales",
  className,
}: RecentSalesCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const displayedSales = sales.slice(0, maxItems)
  const isEmpty = !loading && sales.length === 0

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className={cn("transition-colors", className)}>
      <CardHeader className={cn(sizeClasses[size], "pb-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            {loading ? (
              <>
                <Skeleton className="h-5 w-32" />
                {description && <Skeleton className="h-4 w-48" />}
              </>
            ) : (
              <>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </>
            )}
          </div>
          {action && !loading && action}
        </div>
      </CardHeader>
      <CardContent className={cn(sizeClasses[size], "pt-0")}>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center py-8">
            <p className="muted text-center">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedSales.map((sale, index) => (
              <div key={index} className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  {sale.avatar && <AvatarImage src={sale.avatar} alt={sale.name} />}
                  <AvatarFallback>{getInitials(sale.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium text-foreground leading-none truncate">
                    {sale.name}
                  </p>
                  <p className="muted truncate">{sale.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{sale.amount}</p>
                  {sale.badge}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
