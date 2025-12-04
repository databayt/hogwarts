import Image from "next/image";

const paymentMethods = [
  { name: "Visa", icon: "/payment/visa.svg" },
  { name: "Mastercard", icon: "/payment/mastercard.svg" },
  { name: "American Express", icon: "/payment/amex.svg" },
  { name: "Apple Pay", icon: "/payment/apple-pay.svg" },
  { name: "Google Pay", icon: "/payment/google-pay.svg" },
  { name: "Mada", icon: "/payment/mada.svg" },
];

export function SecurePayment() {
  return (
    <section className="w-full py-16 my-10 rounded-3xl bg-[#6A9BCC]">
      <div className="flex flex-col items-center text-center px-6">
        {/* Title */}
        <h2 className="text-white mb-2">Secure Payment</h2>
        <p className="text-white/80 max-w-xl mb-8">
          Your transactions are protected with bank-level encryption.
          We accept all major payment methods.
        </p>

        {/* Payment Icons - IKEA style */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.name}
              className="flex items-center justify-center w-16 h-10 bg-white rounded-md shadow-sm"
            >
              <Image
                src={method.icon}
                alt={method.name}
                width={40}
                height={24}
                className="object-contain"
              />
            </div>
          ))}
        </div>

        {/* Powered by Stripe */}
        <div className="flex items-center gap-2 mt-8">
          <span className="text-white/70 text-sm">Powered by</span>
          <span className="text-white font-semibold">Stripe</span>
        </div>
      </div>
    </section>
  );
}
