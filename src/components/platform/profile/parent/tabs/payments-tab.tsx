/**
 * Parent Profile Payments Tab
 * Fee management, payment history, and financial records
 */

"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard, Calendar, Download, ChevronRight, CircleAlert, CircleCheck, Clock, DollarSign, Receipt, TrendingUp, TrendingDown, FileText, Printer, ListFilter, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { ParentProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface PaymentsTabProps {
  profile: ParentProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  isOwner?: boolean
  className?: string
}

interface Fee {
  id: string
  childId: string
  childName: string
  type: 'tuition' | 'activity' | 'uniform' | 'books' | 'transport' | 'meal' | 'other'
  description: string
  amount: number
  dueDate: Date
  status: 'paid' | 'pending' | 'overdue' | 'partial'
  paidAmount?: number
  term: string
  year: number
}

interface Payment {
  id: string
  date: Date
  amount: number
  method: 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'online'
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  reference: string
  fees: string[]
  childName?: string
  receiptUrl?: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  date: Date
  dueDate: Date
  totalAmount: number
  paidAmount: number
  status: 'paid' | 'partial' | 'unpaid' | 'overdue'
  items: {
    description: string
    amount: number
    childName: string
  }[]
}

interface PaymentPlan {
  id: string
  name: string
  totalAmount: number
  installments: number
  paidInstallments: number
  nextPaymentDate: Date
  nextPaymentAmount: number
  status: 'active' | 'completed' | 'defaulted'
}

// ============================================================================
// Mock Data
// ============================================================================

const mockFees: Fee[] = [
  {
    id: 'fee-1',
    childId: 'student-1',
    childName: 'Alex Thompson',
    type: 'tuition',
    description: 'Spring 2024 Tuition Fee',
    amount: 5000,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    status: 'pending',
    term: 'Spring',
    year: 2024
  },
  {
    id: 'fee-2',
    childId: 'student-2',
    childName: 'Emma Thompson',
    type: 'tuition',
    description: 'Spring 2024 Tuition Fee',
    amount: 4500,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    status: 'pending',
    term: 'Spring',
    year: 2024
  },
  {
    id: 'fee-3',
    childId: 'student-1',
    childName: 'Alex Thompson',
    type: 'activity',
    description: 'Basketball Team Fee',
    amount: 250,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'pending',
    term: 'Spring',
    year: 2024
  },
  {
    id: 'fee-4',
    childId: 'student-2',
    childName: 'Emma Thompson',
    type: 'books',
    description: 'Textbooks - Grade 8',
    amount: 450,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'paid',
    paidAmount: 450,
    term: 'Spring',
    year: 2024
  },
  {
    id: 'fee-5',
    childId: 'student-1',
    childName: 'Alex Thompson',
    type: 'tuition',
    description: 'Fall 2023 Tuition Fee',
    amount: 5000,
    dueDate: new Date('2023-09-01'),
    status: 'paid',
    paidAmount: 5000,
    term: 'Fall',
    year: 2023
  }
]

const mockPayments: Payment[] = [
  {
    id: 'pay-1',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    amount: 5000,
    method: 'credit_card',
    status: 'completed',
    reference: 'TXN-2024-001',
    fees: ['fee-5'],
    childName: 'Alex Thompson',
    receiptUrl: '#'
  },
  {
    id: 'pay-2',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    amount: 450,
    method: 'online',
    status: 'completed',
    reference: 'TXN-2024-002',
    fees: ['fee-4'],
    childName: 'Emma Thompson',
    receiptUrl: '#'
  },
  {
    id: 'pay-3',
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    amount: 4500,
    method: 'bank_transfer',
    status: 'completed',
    reference: 'TXN-2023-015',
    fees: [],
    childName: 'Emma Thompson',
    receiptUrl: '#'
  }
]

const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2024-001',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    totalAmount: 10200,
    paidAmount: 0,
    status: 'unpaid',
    items: [
      { description: 'Spring 2024 Tuition', amount: 5000, childName: 'Alex Thompson' },
      { description: 'Spring 2024 Tuition', amount: 4500, childName: 'Emma Thompson' },
      { description: 'Basketball Team Fee', amount: 250, childName: 'Alex Thompson' },
      { description: 'Textbooks - Grade 8', amount: 450, childName: 'Emma Thompson' }
    ]
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2023-015',
    date: new Date('2023-08-15'),
    dueDate: new Date('2023-09-01'),
    totalAmount: 10000,
    paidAmount: 10000,
    status: 'paid',
    items: [
      { description: 'Fall 2023 Tuition', amount: 5000, childName: 'Alex Thompson' },
      { description: 'Fall 2023 Tuition', amount: 4500, childName: 'Emma Thompson' },
      { description: 'Registration Fee', amount: 500, childName: 'Both' }
    ]
  }
]

const mockPaymentPlan: PaymentPlan = {
  id: 'plan-1',
  name: 'Annual Tuition Payment Plan',
  totalAmount: 19000,
  installments: 4,
  paidInstallments: 2,
  nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  nextPaymentAmount: 4750,
  status: 'active'
}

// ============================================================================
// Component
// ============================================================================

export function PaymentsTab({
  profile,
  dictionary,
  lang = 'en',
  isOwner = false,
  className
}: PaymentsTabProps) {
  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current')

  const { children, financialSummary } = profile

  // Filter fees based on selection
  const filteredFees = mockFees.filter(fee => {
    if (selectedChild !== 'all' && fee.childId !== selectedChild) return false
    if (selectedPeriod === 'current' && fee.status === 'paid') return false
    if (selectedPeriod === 'paid' && fee.status !== 'paid') return false
    return true
  })

  // Calculate totals
  const totalDue = filteredFees
    .filter(f => f.status !== 'paid')
    .reduce((sum, f) => sum + f.amount, 0)
  const totalPaid = mockPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const overdueAmount = filteredFees
    .filter(f => f.status === 'overdue')
    .reduce((sum, f) => sum + f.amount, 0)

  const getStatusColor = (status: Fee['status']) => {
    switch (status) {
      case 'paid': return 'text-green-500'
      case 'pending': return 'text-yellow-500'
      case 'overdue': return 'text-red-500'
      case 'partial': return 'text-orange-500'
      default: return ''
    }
  }

  const getPaymentMethodIcon = (method: Payment['method']) => {
    switch (method) {
      case 'credit_card': return <CreditCard className="h-4 w-4" />
      case 'bank_transfer': return <DollarSign className="h-4 w-4" />
      case 'online': return <CreditCard className="h-4 w-4" />
      case 'cash': return <DollarSign className="h-4 w-4" />
      case 'check': return <FileText className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Alert for Overdue Fees */}
      {overdueAmount > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CircleAlert className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium">Overdue Payment Alert</p>
                <p className="text-sm text-muted-foreground">
                  You have ${overdueAmount} in overdue fees. Please make payment to avoid late charges.
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <DollarSign className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalDue}</p>
                <p className="text-xs text-muted-foreground">Total Due</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CircleCheck className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalPaid}</p>
                <p className="text-xs text-muted-foreground">Total Paid (YTD)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <CircleAlert className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${overdueAmount}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {format(financialSummary?.nextPaymentDate || new Date(), 'MMM dd')}
                </p>
                <p className="text-xs text-muted-foreground">Next Due Date</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Plan */}
      {mockPaymentPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {mockPaymentPlan.name}
              </span>
              <Badge variant="secondary">{mockPaymentPlan.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Payment Progress</span>
                <span className="font-medium">
                  {mockPaymentPlan.paidInstallments} / {mockPaymentPlan.installments} installments
                </span>
              </div>
              <Progress
                value={(mockPaymentPlan.paidInstallments / mockPaymentPlan.installments) * 100}
                className="h-2"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-medium">${mockPaymentPlan.totalAmount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Per Installment</p>
                  <p className="font-medium">${mockPaymentPlan.nextPaymentAmount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next Payment</p>
                  <p className="font-medium">{format(mockPaymentPlan.nextPaymentDate, 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remaining</p>
                  <p className="font-medium">
                    ${(mockPaymentPlan.installments - mockPaymentPlan.paidInstallments) * mockPaymentPlan.nextPaymentAmount}
                  </p>
                </div>
              </div>
              <Button className="w-full" size="sm">
                Make Next Payment (${mockPaymentPlan.nextPaymentAmount})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          className="px-3 py-2 text-sm border rounded-md"
          value={selectedChild}
          onChange={(e) => setSelectedChild(e.target.value)}
        >
          <option value="all">All Children</option>
          {(children || []).map(child => (
            <option key={child.id} value={child.id}>
              {child.givenName} {child.surname}
            </option>
          ))}
        </select>

        <select
          className="px-3 py-2 text-sm border rounded-md"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="all">All Fees</option>
          <option value="current">Pending Fees</option>
          <option value="paid">Paid Fees</option>
        </select>

        <Button variant="outline" size="sm">
          <ListFilter className="h-4 w-4 mr-1" />
          More Filters
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="fees" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="fees">Current Fees</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Fees & Charges
                </span>
                <Button size="sm">
                  Pay All (${totalDue})
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredFees.map((fee) => (
                <div key={fee.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{fee.description}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {fee.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{fee.childName}</span>
                        <span>•</span>
                        <span>Due: {format(fee.dueDate, 'MMM dd, yyyy')}</span>
                        <span>•</span>
                        <span>{fee.term} {fee.year}</span>
                      </div>
                      {fee.status === 'partial' && fee.paidAmount && (
                        <div className="mt-2">
                          <Progress
                            value={(fee.paidAmount / fee.amount) * 100}
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            ${fee.paidAmount} of ${fee.amount} paid
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold">${fee.amount}</p>
                        <Badge
                          variant={
                            fee.status === 'paid' ? 'default' :
                            fee.status === 'overdue' ? 'destructive' :
                            'secondary'
                          }
                          className={cn("text-xs", getStatusColor(fee.status))}
                        >
                          {fee.status}
                        </Badge>
                      </div>
                      {fee.status !== 'paid' && (
                        <Button size="sm">
                          Pay
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredFees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No fees found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        payment.status === 'completed' ? "bg-green-500/10" :
                        payment.status === 'failed' ? "bg-red-500/10" :
                        "bg-yellow-500/10"
                      )}>
                        {getPaymentMethodIcon(payment.method)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">
                            ${payment.amount}
                          </p>
                          <Badge
                            variant={payment.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{format(payment.date, 'MMM dd, yyyy')}</span>
                          <span>•</span>
                          <span>Ref: {payment.reference}</span>
                          {payment.childName && (
                            <>
                              <span>•</span>
                              <span>{payment.childName}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            {payment.method.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {payment.receiptUrl && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Summary Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground">
                Payment trends chart would go here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Invoices & Receipts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockInvoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{invoice.invoiceNumber}</h4>
                        <Badge
                          variant={
                            invoice.status === 'paid' ? 'default' :
                            invoice.status === 'overdue' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Issued: {format(invoice.date, 'MMM dd, yyyy')}</span>
                        <span>•</span>
                        <span>Due: {format(invoice.dueDate, 'MMM dd, yyyy')}</span>
                      </div>

                      {/* Invoice Items */}
                      <div className="mt-3 space-y-1">
                        {invoice.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.description} ({item.childName})
                            </span>
                            <span>${item.amount}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="flex justify-between pt-2 mt-2 border-t">
                        <span className="font-semibold">Total</span>
                        <span className="font-semibold">${invoice.totalAmount}</span>
                      </div>

                      {invoice.status === 'partial' && (
                        <div className="mt-2">
                          <Progress
                            value={(invoice.paidAmount / invoice.totalAmount) * 100}
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            ${invoice.paidAmount} of ${invoice.totalAmount} paid
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Printer className="h-4 w-4" />
                      </Button>
                      {invoice.status !== 'paid' && (
                        <Button size="sm">
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}