// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Image from "next/image"

import { asset } from "@/lib/asset-url"
import { Icons } from "@/components/atom/brand-icons"
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
    <section className="bg-muted my-8 w-full overflow-hidden rounded-3xl">
      <div className="flex flex-col md:flex-row md:items-stretch">
        {/* Left side - blue panel, edge to edge */}
        <div className="flex min-h-64 w-full items-center justify-center bg-[#6A9BCC] md:w-[35%]">
          <Image
            src={asset("/illustrations/category-08.svg")}
            alt={securePayment?.title || "Secure Payment"}
            width={200}
            height={200}
            className="object-contain"
          />
        </div>

        {/* Right side - Content without bg */}
        <div className="flex w-full flex-col justify-center gap-4 p-8 md:w-[65%] md:p-12">
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
          <div className="mt-1 -mb-[15px] -ml-[16px] flex flex-wrap items-center">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isInline = typeof Icon !== "string"
              return (
                <div
                  key={method.name}
                  className={
                    isInline
                      ? "-mr-[20px] -mb-[5px] flex h-[70px] w-[100px] items-center justify-center overflow-visible"
                      : "bg-muted flex h-11 w-[70px] items-center justify-center rounded-md p-2"
                  }
                >
                  {typeof Icon === "string" ? (
                    <Image
                      src={Icon}
                      alt={method.name}
                      width={45}
                      height={30}
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
