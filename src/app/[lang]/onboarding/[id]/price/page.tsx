import { HostStepLayout } from '@/components/onboarding';
import PriceContent from '@/components/onboarding/price/content';

export const metadata = {
  title: "Price | Onboarding",
  description: "Set your school's pricing.",
};

export default function PricePage() {
  return (
    <HostStepLayout title=" " subtitle=" ">
      <PriceContent />
    </HostStepLayout>
  );
} 