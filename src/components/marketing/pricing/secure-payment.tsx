import Image from "next/image";

const paymentMethods = [
  { name: "Visa", icon: "/payment/visa.svg" },
  { name: "Mastercard", icon: "/payment/mastercard.svg" },
  { name: "Amex", icon: "/payment/amex.svg" },
  { name: "Apple Pay", icon: "/payment/apple-pay.svg" },
  { name: "Mada", icon: "/payment/mada.svg" },
];

export function SecurePayment() {
  return (
    <section className="w-full py-16 my-10 rounded-3xl bg-[#6A9BCC]">
      <div className="flex flex-col md:flex-row gap-8 items-center px-8 md:px-12">
        {/* Left side - Icon directly on blue bg */}
        <div className="w-full md:w-[30%] flex justify-center">
          <Image
            src="/anthropic/category-08.svg"
            alt="Secure Payment"
            width={200}
            height={200}
            className="object-contain"
          />
        </div>

        {/* Right side - Content in column */}
        <div className="w-full md:w-[70%] flex flex-col gap-4">
          <div>
            <h2 className="text-white">Secure Payment Gateway</h2>
            <p className="text-white/80 mt-2 max-w-xl">
              Your security is our priority. We use industry-leading encryption
              and security protocols to ensure your payment information is always protected.
            </p>
          </div>

          {/* Payment Icons Row */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {paymentMethods.map((method) => (
              <div
                key={method.name}
                className="flex items-center justify-center w-14 h-9 bg-white rounded-md shadow-sm p-2"
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
            <span className="text-white/70 text-sm">Powered by</span>
            <span className="text-white font-semibold">Stripe</span>
          </div>
        </div>
      </div>
    </section>
  );
}
