import { DollarSign, CreditCard, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PriceCardProps {
  tuitionFee: number;
  registrationFee?: number;
  applicationFee?: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  paymentSchedule: 'monthly' | 'quarterly' | 'semester' | 'annual';
  className?: string;
}

export function PriceCard({ 
  tuitionFee, 
  registrationFee, 
  applicationFee,
  currency,
  paymentSchedule,
  className 
}: PriceCardProps) {
  const formatCurrency = (amount: number) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
    };
    return `${symbols[currency]}${amount.toLocaleString()}`;
  };

  const scheduleLabels = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semester: 'Per Semester',
    annual: 'Annual',
  };

  const feeItems = [
    {
      label: "Tuition Fee",
      amount: tuitionFee,
      icon: DollarSign,
      color: "text-blue-600",
      required: true,
    },
    registrationFee && registrationFee > 0 && {
      label: "Registration Fee",
      amount: registrationFee,
      icon: CreditCard,
      color: "text-green-600",
      required: false,
    },
    applicationFee && applicationFee > 0 && {
      label: "Application Fee",
      amount: applicationFee,
      icon: CreditCard,
      color: "text-purple-600",
      required: false,
    },
  ].filter(Boolean);

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
          <div className="p-3 bg-accent/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Payment Schedule:</span>
              <span className="text-sm text-foreground">{scheduleLabels[paymentSchedule]}</span>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="space-y-3">
            {feeItems.map((item: any, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-background ${item.color}`}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.required && (
                      <p className="text-xs text-muted-foreground">Required</p>
                    )}
                  </div>
                </div>
                <p className="text-lg font-semibold">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>

          {!tuitionFee && (
            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Please set tuition fee to continue with setup
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
