"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fill } from "@/components/school-dashboard/school/format"

import { useBillingText } from "./use-billing-text"

export interface finalTextProps {
  text: string
}

export interface PaymentCardProps {
  title: string
  description: string
  price: string
  feature?: string
  featuredescription?: string
  feature2?: string
  feature2description?: string
  finalText?: finalTextProps[]
  onPay?: (data: {
    cardNumber: string
    expiry: string
    cvc: string
  }) => Promise<void> | void
  className?: string
}

export function PaymentCard({
  title,
  description,
  price,
  feature,
  featuredescription,
  feature2,
  feature2description,
  finalText = [],
  onPay,
  className,
}: PaymentCardProps) {
  const b = useBillingText()
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [index, setIndex] = useState(0)
  const [errors, setErrors] = useState<{
    card?: string
    expiry?: string
    cvc?: string
  }>({})

  const validate = () => {
    const newErrors: typeof errors = {}

    // Card number validation
    if (!/^[0-9 ]{16,19}$/.test(cardNumber)) {
      newErrors.card = b.paymentCard.errCard
    }

    // Expiry validation
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      newErrors.expiry = b.paymentCard.errExpiry
    } else {
      const [month, year] = expiry.split("/").map(Number)
      const now = new Date()
      const expDate = new Date(2000 + year, month - 1)
      if (expDate < now) {
        newErrors.expiry = b.paymentCard.errExpiryPast
      }
    }

    // CVC validation
    if (!/^[0-9]{3,4}$/.test(cvc)) {
      newErrors.cvc = b.paymentCard.errCvc
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePay = () => {
    if (validate()) {
      if (onPay) {
        onPay({ cardNumber, expiry, cvc })
        console.log("Payment processed!")
      } else {
        console.log("error")
      }
    }
  }

  // Final text animation
  useEffect(() => {
    if (!finalText || finalText.length === 0) return

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % finalText.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [finalText])

  return (
    <div className={cn("mx-auto w-full max-w-4xl", className)}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Order Summary */}
        <div className="order-2 md:order-1">
          <div className="space-y-4 md:sticky md:top-6">
            {/* Price Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{b.paymentCard.orderSummary}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {b.paymentCard.subtotal}
                    </span>
                    <span className="tabular-nums">${price || "320"}.00</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="font-medium">{b.paymentCard.total}</span>
                    <span className="text-xl font-semibold tabular-nums">
                      ${price || "320"}.00
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>{b.paymentCard.included}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm leading-none font-medium">
                        {feature || b.paymentCard.defaultFeature}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {featuredescription || b.paymentCard.defaultFeatureDesc}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm leading-none font-medium">
                        {feature2 || b.paymentCard.defaultFeature2}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {feature2description ||
                          b.paymentCard.defaultFeature2Desc}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Form */}
        <Card className="order-1 md:order-2">
          <CardHeader>
            <CardTitle>{title || b.paymentCard.title}</CardTitle>
            <CardDescription>
              {description || b.paymentCard.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">{b.paymentCard.cardNumber}</Label>
              <div className="relative">
                <div className="absolute start-3 top-1/2 z-10 flex h-6 w-8 -translate-y-1/2 items-center justify-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={index}
                      src={
                        [
                          "https://img.icons8.com/color/48/visa.png",
                          "https://img.icons8.com/color/48/mastercard-logo.png",
                          "https://img.icons8.com/color/48/amex.png",
                          "https://img.icons8.com/color/48/rupay.png",
                        ][index % 4]
                      }
                      alt={b.paymentCard.cardAlt}
                      className="h-6 w-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                    />
                  </AnimatePresence>
                </div>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  dir="ltr"
                  className="ps-14 text-start font-mono tracking-wider"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
              {errors.card && (
                <p className="text-destructive text-sm">{errors.card}</p>
              )}
            </div>

            {/* Expiry and CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">{b.paymentCard.expiry}</Label>
                <Input
                  id="expiry"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  dir="ltr"
                  className="text-start font-mono"
                  placeholder="MM/YY"
                  maxLength={5}
                />
                {errors.expiry && (
                  <p className="text-destructive text-sm">{errors.expiry}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">{b.paymentCard.cvc}</Label>
                <Input
                  id="cvc"
                  type="password"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  dir="ltr"
                  className="text-start font-mono"
                  placeholder="123"
                  maxLength={4}
                />
                {errors.cvc && (
                  <p className="text-destructive text-sm">{errors.cvc}</p>
                )}
              </div>
            </div>

            {/* Discount Code */}
            <div className="space-y-2">
              <Label htmlFor="discount">{b.paymentCard.discount}</Label>
              <div className="flex gap-2">
                <Input
                  id="discount"
                  placeholder={b.paymentCard.enterCode}
                  maxLength={12}
                  className="flex-1"
                />
                <Button variant="secondary" type="button">
                  {b.paymentCard.apply}
                </Button>
              </div>
            </div>

            {/* Pay Button */}
            <Button className="mt-2 w-full" onClick={handlePay}>
              {fill(b.paymentCard.pay, { amount: `$${price || "320"}.00` })}
              <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
