import SubdomainContent from "@/components/onboarding/subdomain/content";
import { ListingProvider } from '@/components/onboarding/use-listing';

export const metadata = {
  title: "School Subdomain",
};

export default function Subdomain() {
  return (
    <ListingProvider>
      <SubdomainContent />
    </ListingProvider>
  );
}
