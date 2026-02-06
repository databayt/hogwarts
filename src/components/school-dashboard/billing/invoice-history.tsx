"use client"

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
  return (
    <Tabs defaultValue="invoices" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="invoices">Invoices</TabsTrigger>
        <TabsTrigger value="payments">Payment Methods</TabsTrigger>
      </TabsList>

      <TabsContent value="invoices" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>
                  Your billing and invoice history
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="me-2 h-4 w-4" />
                Export All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No invoices yet
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
                          Invoice #{invoice.stripeInvoiceId.slice(-8)}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {new Date(invoice.periodStart).toLocaleDateString()} -{" "}
                          {new Date(invoice.periodEnd).toLocaleDateString()}
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
                      <Button variant="ghost" size="sm">
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
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment methods</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="me-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No payment methods added
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
                        <p className="font-medium">
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
                      {method.isDefault && <Badge>Default</Badge>}
                      <Button variant="ghost" size="sm">
                        Remove
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
