"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { CreditCard, Download, Plus, Receipt } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBillingText } from "@/components/billingsdk/use-billing-text"
import { useLocale } from "@/components/internationalization/use-locale"
import {
  fill,
  formatConsoleDate,
} from "@/components/school-dashboard/school/format"

import { formatCurrency } from "./config"
import type { InvoiceWithDetails, PaymentMethodWithUser } from "./types"

interface InvoiceHistoryProps {
  invoices: InvoiceWithDetails[]
  paymentMethods: PaymentMethodWithUser[]
}

export function InvoiceHistory({
  invoices,
  paymentMethods,
}: InvoiceHistoryProps) {
  const b = useBillingText().invoiceHistory
  const { locale } = useLocale()
  return (
    <Tabs defaultValue="invoices" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="invoices">{b.heading}</TabsTrigger>
        <TabsTrigger value="payments">{b.paymentMethods}</TabsTrigger>
      </TabsList>

      <TabsContent value="invoices" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{b.recent}</CardTitle>
                <CardDescription>{b.recentDescription}</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="me-2 h-4 w-4" />
                {b.exportAll}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  {b.empty}
                </p>
              ) : (
                invoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <Receipt className="text-muted-foreground h-8 w-8" />
                      <div>
                        <p className="font-medium">
                          {fill(b.invoiceNo, {
                            number: invoice.stripeInvoiceId.slice(-8),
                          })}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {formatConsoleDate(invoice.periodStart, locale)} -{" "}
                          {formatConsoleDate(invoice.periodEnd, locale)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-end">
                        <p className="font-medium">
                          {formatCurrency(invoice.amountDue)}
                        </p>
                        <Badge
                          variant={
                            invoice.status === "paid" ? "default" : "outline"
                          }
                          className="mt-1"
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={b.downloadInvoice}
                        title={b.downloadInvoice}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payments" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{b.paymentMethods}</CardTitle>
                <CardDescription>{b.paymentMethodsDescription}</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="me-2 h-4 w-4" />
                {b.add}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  {b.emptyMethods}
                </p>
              ) : (
                paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <CreditCard className="text-muted-foreground h-8 w-8" />
                      <div>
                        <p className="font-medium" dir="ltr">
                          {method.cardBrand
                            ? `${method.cardBrand.toUpperCase()} •••• ${method.cardLast4}`
                            : method.type}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {method.billingName || method.user.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isDefault && <Badge>{b.default}</Badge>}
                      <Button variant="ghost" size="sm">
                        {b.remove}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
