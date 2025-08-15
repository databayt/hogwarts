import ImportContent from "@/components/onboarding/import/content";
import { ListingProvider } from '@/components/onboarding/use-listing';

export const metadata = {
  title: "Import Data",
};

export default function Import() {
  return (
    <ListingProvider>
      <ImportContent />
    </ListingProvider>
  );
}