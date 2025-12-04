import Image from "next/image";

const paymentMethods = [
  { name: "Visa", color: "#1A1F71" },
  { name: "Mastercard", color: "#EB001B" },
  { name: "Amex", color: "#006FCF" },
  { name: "Apple Pay", color: "#000000" },
  { name: "Mada", color: "#006A4D" },
];

export function SecurePayment() {
  return (
    <section className="w-full py-16 my-10 rounded-3xl bg-[#6A9BCC]">
      <div className="flex flex-col md:flex-row gap-8 items-center px-8 md:px-12">
        {/* Left side - Icon Card */}
        <div className="w-full md:w-[30%] flex justify-center">
          <div className="relative w-56 h-56 rounded-3xl bg-[#141413] flex items-center justify-center overflow-hidden">
            <Image
              src="/anthropic/category-08.svg"
              alt="Secure Payment"
              width={180}
              height={180}
              className="object-contain"
            />
          </div>
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
                className="flex items-center justify-center px-4 py-2 bg-white rounded-lg shadow-sm"
              >
                <span className="text-sm font-semibold" style={{ color: method.color }}>
                  {method.name}
                </span>
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
