import Image from "next/image";
import { Shield, Lock, CreditCard, CheckCircle } from "lucide-react";

const paymentFeatures = [
  {
    icon: Shield,
    title: "Bank-Level Security",
    description: "256-bit SSL encryption protects all transactions",
  },
  {
    icon: Lock,
    title: "PCI DSS Compliant",
    description: "Meeting the highest security standards",
  },
  {
    icon: CreditCard,
    title: "Multiple Payment Methods",
    description: "Cards, bank transfers, and digital wallets",
  },
  {
    icon: CheckCircle,
    title: "Money-Back Guarantee",
    description: "30-day refund policy, no questions asked",
  },
];

export function SecurePayment() {
  return (
    <section className="w-full py-20">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Left side - 30% - Icon Card */}
        <div className="w-full md:w-[30%] flex justify-center">
          <div className="relative w-64 h-64 rounded-3xl bg-[#141413] flex items-center justify-center overflow-hidden">
            <Image
              src="/anthropic/category-08.svg"
              alt="Secure Payment"
              width={200}
              height={200}
              className="object-contain"
            />
          </div>
        </div>

        {/* Right side - 70% - Content */}
        <div className="w-full md:w-[70%] flex flex-col gap-6">
          <div>
            <h2>Secure Payment Gateway</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Your security is our priority. We use industry-leading encryption
              and security protocols to ensure your payment information is always protected.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {paymentFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 p-4 rounded-xl bg-muted"
              >
                <div className="p-2 rounded-lg bg-[#141413]">
                  <feature.icon className="size-5 text-[#FAF9F5]" />
                </div>
                <div>
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Payment provider */}
          <div className="flex items-center gap-3 mt-4">
            <span className="text-sm text-muted-foreground">Powered by</span>
            <span className="font-semibold text-foreground">Stripe</span>
          </div>
        </div>
      </div>
    </section>
  );
}
