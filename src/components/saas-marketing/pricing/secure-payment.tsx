// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Image from "next/image"

import { asset } from "@/lib/asset-url"
import { Icons } from "@/components/atom/icons"
import type { getDictionary } from "@/components/internationalization/dictionaries"

const paymentMethods = [
  { name: "Visa", icon: Icons.visa },
  { name: "Mastercard", icon: Icons.mastercard },
  { name: "Amex", icon: Icons.americanExpress },
  { name: "Apple Pay", icon: Icons.applePay },
  { name: "Google Pay", icon: Icons.googlePay },
  { name: "PayPal", icon: Icons.paypal },
  { name: "Bitcoin", icon: Icons.bitcoin },
  { name: "STCPay", icon: Icons.stcpay },
  { name: "Fawry", icon: Icons.fawry },
  { name: "Bankak", icon: Icons.bankak },
  { name: "Mada", icon: Icons.mada },
  { name: "Tabby", icon: Icons.tabby },
  { name: "Tamara", icon: Icons.tamara },
]

interface SecurePaymentProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function SecurePayment({ dictionary }: SecurePaymentProps) {
  const securePayment = dictionary?.marketing?.pricing?.securePayment

  return (
    <section className="bg-muted my-8 w-[90%] max-w-5xl rounded-3xl p-8 md:p-12">
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
        {/* Left side - Icon with blue bg */}
        <div className="flex w-full justify-center md:w-[30%]">
          <div className="flex h-52 w-52 items-center justify-center rounded-3xl bg-[#6A9BCC]">
            <Image
              src={asset("/illustrations/category-08.svg")}
              alt={securePayment?.title || "Secure Payment"}
              width={168}
              height={168}
              className="object-contain"
            />
          </div>
        </div>

        {/* Right side - Content without bg */}
        <div className="flex w-full flex-col gap-4 md:w-[70%]">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {securePayment?.title || "Secure Payment"}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              {securePayment?.description ||
                "Your security is our priority. We use industry-leading encryption and security protocols to ensure your payment information is always protected."}
            </p>
          </div>

          {/* Payment Icons Row */}
          <div className="mt-1 -mb-[12px] -ml-[13px] flex flex-wrap items-center">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isInline = typeof Icon !== "string"
              return (
                <div
                  key={method.name}
                  className={
                    isInline
                      ? "-mr-[16px] -mb-[4px] flex h-14 w-20 items-center justify-center overflow-visible"
                      : "bg-muted flex h-9 w-14 items-center justify-center rounded-md p-2"
                  }
                >
                  {typeof Icon === "string" ? (
                    <Image
                      src={Icon}
                      alt={method.name}
                      width={36}
                      height={24}
                      className="object-contain"
                    />
                  ) : (
                    <Icon className="h-full w-full" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Powered by Stripe */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {securePayment?.poweredBy || "Powered by"}
            </span>
            <span className="font-semibold">Stripe</span>
          </div>
        </div>
      </div>
    </section>
  )
}
