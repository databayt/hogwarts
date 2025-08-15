import TitleContent from "@/components/onboarding/title/content";
import { ListingProvider } from '@/components/onboarding/use-listing';

export const metadata = {
  title: "School Name",
};

export default function Title() {
  return (
    <ListingProvider>
      <TitleContent />
    </ListingProvider>
  );
}