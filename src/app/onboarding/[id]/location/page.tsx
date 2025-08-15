import LocationContent from "@/components/onboarding/location/content";
import { ListingProvider } from '@/components/onboarding/use-listing';

export const metadata = {
  title: "School Location",
};

export default function Location() {
  return (
    <ListingProvider>
      <LocationContent />
    </ListingProvider>
  );
}