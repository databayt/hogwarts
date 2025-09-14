import DiscountContent from "@/components/onboarding/discount/content";

export const metadata = {
  title: "Discount | Onboarding",
  description: "Set up discount options for your school.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Discount({ params }: PageProps) {
  return <DiscountContent params={params} />;
}