import { HostStepLayout } from '@/components/onboarding';
import PriceContent from '@/components/onboarding/price/content';

export const metadata = {
  title: "Price | Onboarding",
  description: "Set your school's pricing.",
};

export default function PricePage() {
  return (
    <HostStepLayout
      title={
        <div className="space-y-3 sm:space-y-4">
          <h3>
            Set your school's
            <br />
            tuition fees
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            This will be the annual tuition fee for your school. You can change this later in your school settings.
          </p>
        </div>
      }
    >
      <PriceContent />
    </HostStepLayout>
  );
} 