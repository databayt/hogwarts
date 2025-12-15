import { Calendar, CreditCard, DollarSign } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PriceCardProps {
  tuitionFee: number
  registrationFee?: number
  applicationFee?: number
  currency: "USD" | "EUR" | "GBP" | "CAD" | "AUD"
  paymentSchedule: "monthly" | "quarterly" | "semester" | "annual"
  className?: string
}

export function PriceCard({
  tuitionFee,
  registrationFee,
  applicationFee,
  currency,
  paymentSchedule,
  className,
}: PriceCardProps) {
  const formatCurrency = (amount: number) => {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      CAD: "C$",
      AUD: "A$",
    }
    return `${symbols[currency]}${amount.toLocaleString()}`
  }

  const scheduleLabels = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    semester: "Per Semester",
    annual: "Annual",
  }

  const feeItems = [
    {
      label: "Tuition Fee",
      amount: tuitionFee,
      icon: DollarSign,
      color: "text-primary",
      required: true,
    },
    registrationFee &&
      registrationFee > 0 && {
        label: "Registration Fee",
        amount: registrationFee,
        icon: CreditCard,
        color: "text-chart-2",
        required: false,
      },
    applicationFee &&
      applicationFee > 0 && {
        label: "Application Fee",
        amount: applicationFee,
        icon: CreditCard,
        color: "text-chart-3",
        required: false,
      },
  ].filter(Boolean)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          School Pricing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Payment Schedule */}
          <div className="bg-accent/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Payment Schedule:</span>
              <span className="text-foreground text-sm">
                {scheduleLabels[paymentSchedule]}
              </span>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="space-y-3">
            {feeItems.map((item: any, index) => (
              <div
                key={index}
                className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`bg-background rounded-lg p-2 ${item.color}`}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.required && (
                      <p className="text-muted-foreground text-xs">Required</p>
                    )}
                  </div>
                </div>
                <p className="text-lg font-semibold">
                  {formatCurrency(item.amount)}
                </p>
              </div>
            ))}
          </div>

          {!tuitionFee && (
            <div className="bg-accent/50 rounded-lg p-3">
              <p className="text-muted-foreground text-sm">
                Please set tuition fee to continue with setup
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
