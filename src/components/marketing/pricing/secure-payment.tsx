import Image from "next/image";

const paymentMethods = [
  { name: "Visa", icon: "/payment/visa.svg" },
  { name: "Mastercard", icon: "/payment/mastercard.svg" },
  { name: "Amex", icon: "/payment/amex.svg" },
  { name: "Apple Pay", icon: "/payment/apple-pay.svg" },
  { name: "Google Pay", icon: "/payment/google-pay.svg" },
  { name: "PayPal", icon: "/payment/paypal.svg" },
  { name: "Mada", icon: "/payment/mada.svg" },
  { name: "STCPay", icon: "/payment/stcpay.svg" },
  { name: "Fawry", icon: "/payment/fawry.svg" },
];

export function SecurePayment() {
  return (
    <section className="w-full py-16">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Left side - Icon with blue bg */}
        <div className="w-full md:w-[30%] flex justify-center">
          <div className="w-56 h-56 rounded-3xl bg-[#6A9BCC] flex items-center justify-center">
            <Image
              src="/anthropic/category-08.svg"
              alt="Secure Payment"
              width={180}
              height={180}
              className="object-contain"
            />
          </div>
        </div>

        {/* Right side - Content without bg */}
        <div className="w-full md:w-[70%] flex flex-col gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Secure Payment</h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Your security is our priority. We use industry-leading encryption
              and security protocols to ensure your payment information is always protected.
            </p>
          </div>

          {/* Payment Icons Row */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {paymentMethods.map((method) => (
              <div
                key={method.name}
                className="flex items-center justify-center w-14 h-9 bg-muted rounded-md p-2"
              >
                <Image
                  src={method.icon}
                  alt={method.name}
                  width={36}
                  height={24}
                  className="object-contain"
                />
              </div>
            ))}
          </div>

          {/* Powered by Stripe */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Powered by</span>
            <span className="font-semibold">Stripe</span>
          </div>
        </div>
      </div>
    </section>
  );
}
