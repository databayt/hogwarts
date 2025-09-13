import { HostStepLayout } from '@/components/onboarding';
import PriceContent from '@/components/onboarding/price/content';

interface PricePageProps {
  params: Promise<{ id: string }>;
}

export default async function PricePage({ params }: PricePageProps) {
  const { id } = await params;

  return (
    <HostStepLayout title=" " subtitle=" ">
      <PriceContent />
    </HostStepLayout>
  );
} 